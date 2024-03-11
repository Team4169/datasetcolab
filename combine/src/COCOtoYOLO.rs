use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let overall_dir = &args[1];
    let dataset = &args[2];
    let class_names = &args[3..];

    let valid_dir = Path::new(overall_dir).join("valid");
    let train_dir = Path::new(overall_dir).join("train");
    let test_dir = Path::new(overall_dir).join("test");

    convert_coco_json(&valid_dir, &valid_dir, &valid_dir).unwrap();
    convert_coco_json(&train_dir, &train_dir, &train_dir).unwrap();
    convert_coco_json(&test_dir, &test_dir, &test_dir).unwrap();

    // Create data.yaml
    create_data_yaml(overall_dir, class_names).unwrap();

    // Delete JSON file
    remove_json_files(&valid_dir).unwrap();
    remove_json_files(&train_dir).unwrap();
    remove_json_files(&test_dir).unwrap();
}

#[derive(Debug, Serialize, Deserialize)]
struct Data {
    train: String,
    val: String,
    test: String,
    names: HashMap<usize, String>,
}

fn convert_coco_json(json_dir: &Path, dataset_dir: &Path, images_dir: &Path) -> io::Result<()> {
    fn make_dirs(dataset_dir: &Path) -> (PathBuf, PathBuf) {
        let images_dir_path = dataset_dir.join("images");
        let labels_dir_path = dataset_dir.join("labels");
        fs::create_dir_all(&images_dir_path)?;
        fs::create_dir_all(&labels_dir_path)?;
        (images_dir_path, labels_dir_path)
    }

    fn coco91_to_coco80_class() -> Vec<Option<usize>> {
        let x = vec![
            Some(0), Some(1), Some(2), Some(3), Some(4), Some(5), Some(6), Some(7), Some(8), Some(9),
            Some(10), None, Some(11), Some(12), Some(13), Some(14), Some(15), Some(16), Some(17), Some(18),
            Some(19), Some(20), Some(21), Some(22), Some(23), None, Some(24), Some(25), None, None, Some(26),
            Some(27), Some(28), Some(29), Some(30), Some(31), Some(32), Some(33), Some(34), Some(35), Some(36),
            Some(37), Some(38), Some(39), None, Some(40), Some(41), Some(42), Some(43), Some(44), Some(45),
            Some(46), Some(47), Some(48), Some(49), Some(50), Some(51), Some(52), Some(53), Some(54), Some(55),
            Some(56), Some(57), Some(58), Some(59), None, Some(60), None, None, Some(61), None, Some(62),
            Some(63), Some(64), Some(65), Some(66), Some(67), Some(68), Some(69), Some(70), Some(71), Some(72),
            None, Some(73), Some(74), Some(75), Some(76), Some(77), Some(78), Some(79), None,
        ];
        x
    }

    let (images_dir_path, labels_dir_path) = make_dirs(dataset_dir);
    let coco80 = coco91_to_coco80_class();

    for entry in fs::read_dir(json_dir)? {
        let entry = entry?;
        let json_file = entry.path();

        let file = File::open(&json_file)?;
        let data: serde_json::Value = serde_json::from_reader(file)?;

        let images = data["images"].as_array().unwrap().iter()
            .map(|x| (x["id"].as_u64().unwrap().to_string(), x.clone()))
            .collect::<HashMap<String, serde_json::Value>>();
        let mut img_to_anns = HashMap::new();
        for ann in data["annotations"].as_array().unwrap() {
            let img_id = ann["image_id"].as_u64().unwrap().to_string();
            img_to_anns.entry(img_id).or_insert_with(Vec::new).push(ann.clone());
        }

        for (img_id, anns) in img_to_anns {
            let img = images[&img_id];
            let h = img["height"].as_u64().unwrap() as f64;
            let w = img["width"].as_u64().unwrap() as f64;
            let f = img["file_name"].as_str().unwrap();

            let img_path = images_dir.join(f);
            if img_path.exists() {
                fs::rename(&img_path, images_dir_path.join(f))?;
            } else {
                println!("Image file not found: {:?}", img_path);
            }

            let mut bboxes = vec![];
            let mut segments = vec![];

            for ann in anns {
                if ann["iscrowd"].as_u64().unwrap() != 0 {
                    continue;
                }
                let bbox = ann["bbox"].as_array().unwrap().iter()
                    .map(|x| x.as_f64().unwrap()).collect::<Vec<f64>>();
                let mut box = bbox.clone();
                box[0] += bbox[2] / 2.0;
                box[1] += bbox[3] / 2.0;
                box[0] /= w;
                box[1] /= h;
                if box[2] <= 0.0 || box[3] <= 0.0 {
                    continue;
                }

                let cls = match ann["category_id"].as_u64() {
                    Some(cat_id) => coco80[cat_id as usize - 1].unwrap_or(0),
                    None => 0,
                };
                box.insert(0, cls as f64);
                if !bboxes.contains(&box) {
                    bboxes.push(box);
                }

                if let Some(segments_data) = ann["segmentation"].as_array() {
                    let mut s = vec![];
                    if segments_data.len() > 1 {
                        s = merge_multi_segment(segments_data, w, h);
                    } else {
                        for seg in segments_data.iter() {
                            for j in seg.as_array().unwrap().iter() {
                                s.push(j.as_f64().unwrap());
                            }
                        }
                        s = s.chunks(2).map(|c| (c[0] / w, c[1] / h)).flatten().collect();
                    }
                    let mut s_vec: Vec<f64> = vec![cls as f64];
                    s_vec.extend_from_slice(&s);
                    if !segments.contains(&s_vec) {
                        segments.push(s_vec);
                    }
                }
            }

            let mut file = File::create(labels_dir_path.join(Path::new(f).file_stem().unwrap().to_str().unwrap().to_owned() + ".txt"))?;
            for bbox in bboxes {
                let line = bbox.iter().map(|x| x.to_string()).collect::<Vec<String>>().join(" ");
                writeln!(&mut file, "{}", line)?;
            }
        }
    }
    Ok(())
}

fn merge_multi_segment(segments: &serde_json::Value, w: f64, h: f64) -> Vec<f64> {
    let segments: Vec<Vec<f64>> = segments.as_array().unwrap().iter()
        .map(|seg| {
            seg.as_array().unwrap().iter()
                .map(|x| x.as_f64().unwrap()).collect()
        }).collect();

    let mut idx_list: Vec<Vec<usize>> = vec![Vec::new(); segments.len()];

    for i in 1..segments.len() {
        let (idx1, idx2) = min_index(&segments[i - 1], &segments[i]);
        idx_list[i - 1].push(idx1);
        idx_list[i].push(idx2);
    }

    let mut s: Vec<Vec<f64>> = Vec::new();
    for k in 0..2 {
        if k == 0 {
            for i in 0..segments.len() {
                if idx_list[i].len() == 2 && idx_list[i][0] > idx_list[i][1] {
                    idx_list[i].reverse();
                    segments[i].reverse();
                }
                let idx_0 = idx_list[i][0];
                segments[i].rotate_left(idx_0);
                segments[i].push(segments[i][0]);
                if i == 0 || i == segments.len() - 1 {
                    s.push(segments[i].clone());
                } else {
                    let idx_1 = idx_list[i][1] - idx_0;
                    s.push(segments[i][idx_0..=idx_1].to_vec());
                }
            }
        } else {
            for i in (0..segments.len()).rev() {
                if i != 0 && i != segments.len() - 1 {
                    let idx_1 = idx_list[i][1] - idx_list[i][0];
                    s.push(segments[i][idx_1..].to_vec());
                }
            }
        }
    }
    s.iter().flatten().map(|x| x / w).collect()
}

fn min_index(arr1: &[f64], arr2: &[f64]) -> (usize, usize) {
    let mut min_dist = f64::MAX;
    let mut min_idx1 = 0;
    let mut min_idx2 = 0;
    for (idx1, p1) in arr1.iter().enumerate() {
        for (idx2, p2) in arr2.iter().enumerate() {
            let dist = (p1 - p2).hypot();
            if dist < min_dist {
                min_dist = dist;
                min_idx1 = idx1;
                min_idx2 = idx2;
            }
        }
    }
    (min_idx1, min_idx2)
}

fn create_data_yaml(overall_dir: &str, class_names: &[String]) -> io::Result<()> {
    let mut names_map = HashMap::new();
    for (idx, name) in class_names.iter().enumerate() {
        names_map.insert(idx, name);
    }

    let data = Data {
        train: "train".to_string(),
        val: "valid".to_string(),
        test: "test".to_string(),
        names: names_map,
    };

    let yaml_data = serde_yaml::to_string(&data)?;

    let mut file = File::create(Path::new(overall_dir).join("data.yaml"))?;
    file.write_all(yaml_data.as_bytes())?;
    Ok(())
}

fn remove_json_files(dir: &Path) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if let Some(extension) = path.extension() {
            if extension == "json" {
                fs::remove_file(&path)?;
            }
        }
    }
    Ok(())
}
