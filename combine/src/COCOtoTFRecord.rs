use std::fs;
use std::path::Path;
use pycocotools::coco::Coco;
use image::GenericImageView;
use rand::seq::SliceRandom;
use tensorflow::tfrecord::{Example, Feature, Features};
use tensorflow::ExampleOptions;
use tensorflow::DataType;
use tensorflow::DataType::Float;
use tensorflow::DataType::Int64;
use tensorflow::DataType::Bytes;
use tensorflow::Tensor;
use std::collections::HashMap;
use std::io::{Write, Read};

struct Flags {
    image_dir: String,
    annotation_path: String,
    output_filepath: String,
    shuffle_imgs: bool,
    shards: i32,
}

impl Flags {
    fn from_args() -> Self {
        // Simulating command line arguments with hardcoded values
        Flags {
            image_dir: String::from("/path/to/image_dir"),
            annotation_path: String::from("/path/to/annotations.json"),
            output_filepath: String::from("/path/to/output.tfrecord"),
            shuffle_imgs: true,
            shards: 1,
        }
    }
}

fn convert_to_feature(value: &Vec<f64>, value_type: Option<&str>) -> Feature {
    let element = value.first().unwrap();
    let value_type = match value_type {
        Some(val_type) => val_type,
        None => {
            if let Some(element) = value.first() {
                if element.is_integer() {
                    "int64"
                } else if element.is_floating_point() {
                    "float"
                } else {
                    panic!("Cannot convert type to feature");
                }
            } else {
                panic!("Empty vector cannot be converted to feature");
            }
        }
    };

    match value_type {
        "int64" => {
            let tensor = Tensor::new(&[value.len() as u64])
                .with_values(&value.iter().map(|v| *v as i64).collect::<Vec<_>>());
            Feature::new::<Int64>(tensor)
        }
        "float" => {
            let tensor = Tensor::new(&[value.len() as u64])
                .with_values(&value.iter().map(|v| *v as f32).collect::<Vec<_>>());
            Feature::new::<Float>(tensor)
        }
        _ => panic!("Unknown value type parameter - {}", value_type),
    }
}

fn create_pbtxt_from_label_map(anns: &HashMap<usize, serde_json::Value>, output_path: &str) {
    let mut pbtext = String::new();
    for (i, ann) in anns.iter().enumerate() {
        if i == 0 {
            continue;
        }
        let ann = ann.1.as_object().unwrap();
        pbtext += &format!("item {{\n");
        pbtext += &format!("\tname: \"{}\",\n", ann["name"].as_str().unwrap());
        pbtext += &format!("\tid: {},\n", ann["id"].as_u64().unwrap());
        pbtext += &format!("\tdisplay_name: \"{}\"\n}}\n", ann["name"].as_str().unwrap());
    }

    let pbtextfile_path = Path::new(output_path).join("labelmap.pbtxt");
    let mut pbtextfile = fs::File::create(pbtextfile_path).unwrap();
    pbtextfile.write_all(pbtext.as_bytes()).unwrap();
}

fn load_coco_detection_dataset(image_dir: &str, annotation_path: &str, shuffle_img: bool) -> Vec<HashMap<String, Box<dyn Tensor>>> {
    let coco = Coco::new(annotation_path);
    let img_ids = coco.get_img_ids();
    let cat_ids = coco.get_cat_ids();

    create_pbtxt_from_label_map(&coco.get_cats(), &annotation_path);

    let mut rng = rand::thread_rng();
    let mut coco_data = vec![];

    let nb_imgs = img_ids.len();
    for (index, img_id) in img_ids.iter().enumerate() {
        if index % 100 == 0 {
            println!("Reading images: {} / {}", index, nb_imgs);
        }

        let img_info = HashMap::new();
        let pic_height;
        let pic_width;
        let img_detail = coco.load_imgs(*img_id)[0].clone();
        pic_height = img_detail.height as f64;
        pic_width = img_detail.width as f64;
        let ann_ids = coco.get_ann_ids(&[*img_id], &cat_ids, None);
        let anns = coco.load_anns(&ann_ids);
        let mut bboxes = vec![];
        let mut labels = vec![];

        for ann in &anns {
            let bbox_data = ann.bbox;
            let bbox = [
                bbox_data[0] / pic_width,
                bbox_data[1] / pic_height,
                bbox_data[2] / pic_width,
                bbox_data[3] / pic_height,
            ];
            bboxes.push(bbox);
            labels.push(ann.category_id as f64);
        }

        let img_path = Path::new(image_dir).join(&img_detail.file_name);
        let mut img_bytes = vec![];
        fs::File::open(&img_path)
            .unwrap()
            .read_to_end(&mut img_bytes)
            .unwrap();

        let mut img_info = HashMap::new();
        img_info.insert("pixel_data".to_string(), convert_to_feature(&img_bytes, Some("bytes")));
        img_info.insert("height".to_string(), convert_to_feature(&vec![pic_height], Some("float")));
        img_info.insert("width".to_string(), convert_to_feature(&vec![pic_width], Some("float")));
        img_info.insert("bboxes".to_string(), convert_to_feature(&bboxes, Some("float")));
        img_info.insert("labels".to_string(), convert_to_feature(&labels, Some("float")));
        coco_data.push(img_info);
    }

    if shuffle_img {
        coco_data.shuffle(&mut rng);
    }

    coco_data
}

fn dict_to_coco_example(img_data: &HashMap<String, Box<dyn Tensor>>) -> Example {
    let bboxes: Vec<f64> = img_data["bboxes"].as_ref().to_vec().unwrap().iter().map(|x| x.f64_value().unwrap()).collect();
    let mut xmin = vec![];
    let mut xmax = vec![];
    let mut ymin = vec![];
    let mut ymax = vec![];

    for bbox in &bboxes {
        xmin.push(bbox[0]);
        xmax.push(bbox[0] + bbox[2]);
        ymin.push(bbox[1]);
        ymax.push(bbox[1] + bbox[3]);
    }

    let example = Example::new(ExampleOptions {
        features: Some(Features {
            feature: {
                let mut map = HashMap::new();
                map.insert("image/height".to_string(), convert_to_feature(&vec![img_data["height"].f64_value().unwrap()], Some("float")));
                map.insert("image/width".to_string(), convert_to_feature(&vec![img_data["width"].f64_value().unwrap()], Some("float")));
                map.insert("image/object/bbox/xmin".to_string(), convert_to_feature(&xmin, Some("float")));
                map.insert("image/object/bbox/xmax".to_string(), convert_to_feature(&xmax, Some("float")));
                map.insert("image/object/bbox/ymin".to_string(), convert_to_feature(&ymin, Some("float")));
                map.insert("image/object/bbox/ymax".to_string(), convert_to_feature(&ymax, Some("float")));
                map.insert("image/object/class/label".to_string(), convert_to_feature(&img_data["labels"].f64_value().unwrap().to_vec().unwrap(), Some("float")));
                map.insert("image/encoded".to_string(), convert_to_feature(&img_data["pixel_data"].bytes_value().unwrap().to_vec().unwrap(), Some("bytes")));
                map.insert("image/format".to_string(), convert_to_feature(&vec!["jpeg".as_bytes().to_vec()], Some("bytes")));
                map
            },
        }),
    });

    example
}

fn main() {
    let flags = Flags::from_args();

    let output_path = flags.output_filepath.rsplitn(2, '/').last().unwrap();
    if !Path::new(output_path).exists() {
        fs::create_dir_all(output_path).unwrap();
    }

    let coco_data = load_coco_detection_dataset(&flags.image_dir, &flags.annotation_path, flags.shuffle_imgs);
    let total_imgs = coco_data.len();
    let num_shards = flags.shards;

    let mut writers = vec![];
    for i in 0..num_shards {
        let filepath = format!("{}-{:05}-of-{:05}.tfrecord", flags.output_filepath, i, num_shards);
        let writer = tfrecord::Writer::from_path(&filepath).unwrap();
        writers.push(writer);
    }

    for (index, img_data) in coco_data.iter().enumerate() {
        if index % 100 == 0 {
            println!("Converting images: {} / {}", index, total_imgs);
        }

        if let Some(bboxes) = img_data.get("bboxes") {
            if !bboxes.to_vec().unwrap().is_empty() {
                let example = dict_to_coco_example(img_data);
                let idx = index % num_shards as usize;
                writers[idx].write(&example).unwrap();
            }
        }
    }

    for writer in writers {
        writer.flush().unwrap();
    }
}
