use serde::{Serialize, Deserialize};
use serde_json::{Value, to_string_pretty};
use walkdir::WalkDir;
use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CocoDataset {
    images: Vec<Image>,
    annotations: Vec<Value>,
    categories: Vec<Category>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Image {
    id: i64,
    file_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
struct Category {
    id: i64,
    name: String,
}

fn combine(directories: Vec<&str>, output_dir: &str, dir_name: &str) -> io::Result<()> {
    let image_output_dir = Path::new(output_dir).join(dir_name);
    fs::create_dir_all(&image_output_dir)?;

    let output_file = Path::new(output_dir).join(dir_name.to_owned()+"/_annotations.coco.json");

    let mut combined_dataset = CocoDataset {
        images: vec![],
        annotations: vec![],
        categories: vec![],
    };

    let mut image_id_counter = 1;
    let mut category_id_map = HashMap::new();
    let mut image_name_set = HashSet::new();
    let mut annotation_id_counter = 1;

    for input_dir in directories {
        for entry in WalkDir::new(input_dir)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.path().is_file() && e.path().extension().map_or(false, |e| e == "json"))
        {
            let mut file = File::open(entry.path())?;
            let mut contents = String::new();
            file.read_to_string(&mut contents)?;
            let mut dataset: CocoDataset = serde_json::from_str(&contents)?;

            let mut image_id_map = HashMap::new();

            for category in &mut dataset.categories {
                let new_id = *category_id_map.entry(category.name.clone()).or_insert_with(|| {
                    let new_id = combined_dataset.categories.len() as i64 + 1;
                    combined_dataset.categories.push(Category { id: new_id, name: category.name.clone() });
                    new_id
                });
                category.id = new_id;
            }

            for image in dataset.images {
                let new_image_id = image_id_counter;
                image_id_counter += 1;

                let new_file_name = format!("{}_{}", new_image_id, image.file_name);
                let original_file_path = entry.path().parent().unwrap().join(&image.file_name);
                fs::copy(&original_file_path, &image_output_dir.join(&new_file_name))?;
                image_name_set.insert(new_file_name.clone());

                combined_dataset.images.push(Image {
                    id: new_image_id,
                    file_name: new_file_name,
                });

                image_id_map.insert(image.id, new_image_id);
            }

            for mut annotation in dataset.annotations {
                if let Some(image_id) = annotation["image_id"].as_i64() {
                    if let Some(&new_image_id) = image_id_map.get(&image_id) {
                        annotation["image_id"] = Value::from(new_image_id);
                        annotation["id"] = Value::from(annotation_id_counter);
                        annotation_id_counter += 1;
                    }
                }
                combined_dataset.annotations.push(annotation);
            }
        }
    }

    let combined_json = to_string_pretty(&combined_dataset)?;
    let mut output_file = File::create(&output_file)?;
    output_file.write_all(combined_json.as_bytes())?;

    Ok(())
}


#[derive(Serialize, Deserialize, Debug)]
struct Metadata {
    targetDataset: Option<String>,
    classes: Option<Vec<String>>,
    status: Option<String>,
}

fn find_metadata_folders(directory_path: &str, year: &str, classcombo: &[&str]) -> Vec<String> {
    let mut matching_metadata_folders = Vec::new();
    let classcombo_set: HashSet<&str> = classcombo.iter().cloned().collect();

    for entry in WalkDir::new(directory_path).into_iter().filter_map(Result::ok) {
        if entry.file_name().to_string_lossy() == "metadata.json" {
            let metadata_file_path = entry.path();
            let metadata_contents = fs::read_to_string(metadata_file_path).expect("Failed to read metadata.json");
            let metadata: Metadata = serde_json::from_str(&metadata_contents).expect("Failed to parse JSON");

            if let Some(target_dataset_value) = &metadata.targetDataset {
                if target_dataset_value == year && metadata.status == Some("merged".to_string()) {
                    if let Some(classes) = &metadata.classes {
                        let classes_set: HashSet<&str> = classes.iter().map(String::as_str).collect();
                        if classcombo_set.is_subset(&classes_set) {
                            if let Some(folder_path) = metadata_file_path.parent().and_then(|p| p.to_str()) {
                                matching_metadata_folders.push(folder_path.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    matching_metadata_folders
}


fn main() -> std::io::Result<()> {
    let directory_path = "/home/team4169/datasetcolab/app/upload/";
    let year = "FRC2024";
    let classcombo = ["note"]; // Example classes

    let mut directories = find_metadata_folders(directory_path, year, &classcombo);
    let mut directories2 = directories.clone();
    let mut directories3 = directories.clone();
    let output_dir = "/home/team4169/datasetcolab/rustCombOut1";

    let suffix = "/test";
    for s in &mut directories {
        s.push_str(suffix);
    }

    let directory_refs: Vec<&str> = directories.iter().map(AsRef::as_ref).collect();
    combine(directory_refs, output_dir, "test");

    let suffix2 = "/train";
    for s in &mut directories2 {
        s.push_str(suffix2);
    }

    let directory_refs2: Vec<&str> = directories2.iter().map(AsRef::as_ref).collect();
    combine(directory_refs2, output_dir, "train");

    let suffix3 = "/valid";
    for s in &mut directories2 {
        s.push_str(suffix3);
    }

    let directory_refs3: Vec<&str> = directories3.iter().map(AsRef::as_ref).collect();
    combine(directory_refs3, output_dir, "valid")


    //println!("Directories: {:?}", directories);

    //let directory_refs = vec!["/home/team4169/datasetcolab/test123"];

    // Assuming `combine` function is defined elsewhere in this file
    
    
}
