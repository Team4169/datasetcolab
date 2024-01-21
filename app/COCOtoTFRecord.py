from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from pycocotools.coco import COCO
from PIL import Image
from random import shuffle
from absl import app, flags

import os
import numpy as np
import tensorflow as tf

flags.DEFINE_string('image_dir', '', 'Root directory to raw image files.')
flags.DEFINE_string('annotation_path', '', 'Directory storing annotation .json file.')
flags.DEFINE_string('output_filepath', '', 'Path to output TFRecord')
flags.DEFINE_bool('shuffle_imgs',True,'whether to shuffle images of coco')
flags.DEFINE_integer('shards', '1', 'number of shards to split the data into')
FLAGS = flags.FLAGS

def convert_to_feature(value, value_type=None):
  """Converts the given python object to a tf.train.Feature.

  Args:
    value: int, float, bytes or a list of them.
    value_type: optional, if specified, forces the feature to be of the given
      type. Otherwise, type is inferred automatically. Can be one of
      ['bytes', 'int64', 'float', 'bytes_list', 'int64_list', 'float_list']

  Returns:
    feature: A tf.train.Feature object.
  """

  if value_type is None:

    element = value[0] if isinstance(value, list) else value

    if isinstance(element, bytes):
      value_type = 'bytes'

    elif isinstance(element, (int, np.integer)):
      value_type = 'int64'

    elif isinstance(element, (float, np.floating)):
      value_type = 'float'

    else:
      raise ValueError('Cannot convert type {} to feature'.
                       format(type(element)))

    if isinstance(value, list):
      value_type = value_type + '_list'

  if value_type == 'int64':
    return tf.train.Feature(int64_list=tf.train.Int64List(value=[value]))

  elif value_type == 'int64_list':
    value = np.asarray(value).astype(np.int64).reshape(-1)
    return tf.train.Feature(int64_list=tf.train.Int64List(value=value))

  elif value_type == 'float':
    return tf.train.Feature(float_list=tf.train.FloatList(value=[value]))

  elif value_type == 'float_list':
    value = np.asarray(value).astype(np.float32).reshape(-1)
    return tf.train.Feature(float_list=tf.train.FloatList(value=value))

  elif value_type == 'bytes':
    return tf.train.Feature(bytes_list=tf.train.BytesList(value=[value]))

  elif value_type == 'bytes_list':
    return tf.train.Feature(bytes_list=tf.train.BytesList(value=value))

  else:
    raise ValueError('Unknown value_type parameter - {}'.format(value_type))
  
def _create_pbtxt_from_label_map(anns):
  print(anns)
  pbtext = ""
  for i in range(len(anns)):
      if i == 0:
         continue
      pbtext += "item {\n"
      pbtext += "\tname: \"" + anns[i]["name"] + "\",\n"
      pbtext +="\tid: " + str(anns[i]["id"]) + ",\n"
      pbtext += "\tdisplay_name: \"" + anns[i]["name"] + "\"\n}\n"

  output_path = FLAGS.output_filepath[:FLAGS.output_filepath.rfind('/', 0, FLAGS.output_filepath.rfind("/"))]
  pbtextfile = open(output_path + "/labelmap.pbtxt", 'w')
  pbtextfile.write(pbtext)
  pbtextfile.close()


def load_coco_dection_dataset(imgs_dir, annotations_filepath, shuffle_img = True ):
    """Load data from dataset by pycocotools. This tools can be download from "http://mscoco.org/dataset/#download"
    Args:
        imgs_dir: directories of coco images
        annotations_filepath: file path of coco annotations file
        shuffle_img: wheter to shuffle images order
    Return:
        coco_data: list of dictionary format information of each image
    """
    coco = COCO(annotations_filepath)
    img_ids = coco.getImgIds() # totally 82783 images
    cat_ids = coco.getCatIds() # totally 90 catagories, however, the number of categories is not continuous, \
                               # [0,12,26,29,30,45,66,68,69,71,83] are missing, this is the problem of coco dataset.
    
    _create_pbtxt_from_label_map(anns = coco.cats)

    if shuffle_img:
        shuffle(img_ids)

    coco_data = []

    nb_imgs = len(img_ids)
    for index, img_id in enumerate(img_ids):
        if index % 100 == 0:
            print("Readling images: %d / %d "%(index, nb_imgs))
        img_info = {}
        bboxes = []
        labels = []

        img_detail = coco.loadImgs(img_id)[0]
        pic_height = img_detail['height']
        pic_width = img_detail['width']

        ann_ids = coco.getAnnIds(imgIds=img_id,catIds=cat_ids)
        anns = coco.loadAnns(ann_ids)
        for ann in anns:
            bboxes_data = ann['bbox']
            bboxes_data = [bboxes_data[0]/float(pic_width), bboxes_data[1]/float(pic_height),\
                                  bboxes_data[2]/float(pic_width), bboxes_data[3]/float(pic_height)]
                         # the format of coco bounding boxs is [Xmin, Ymin, width, height]
            bboxes.append(bboxes_data)
            labels.append(ann['category_id'])


        img_path = os.path.join(imgs_dir, img_detail['file_name'])
        img_bytes = tf.io.gfile.GFile(img_path,'rb').read()

        img_info['pixel_data'] = img_bytes
        img_info['height'] = pic_height
        img_info['width'] = pic_width
        img_info['bboxes'] = bboxes
        img_info['labels'] = labels

        coco_data.append(img_info)
    return coco_data


def dict_to_coco_example(img_data):
    """Convert python dictionary formath data of one image to tf.Example proto.
    Args:
        img_data: infomation of one image, inclue bounding box, labels of bounding box,\
            height, width, encoded pixel data.
    Returns:
        example: The converted tf.Example
    """
    bboxes = img_data['bboxes']
    xmin, xmax, ymin, ymax = [], [], [], []
    for bbox in bboxes:
        xmin.append(bbox[0])
        xmax.append(bbox[0] + bbox[2])
        ymin.append(bbox[1])
        ymax.append(bbox[1] + bbox[3])

    example = tf.train.Example(features=tf.train.Features(feature={
        'image/height': convert_to_feature(img_data['height']),
        'image/width': convert_to_feature(img_data['width']),
        'image/object/bbox/xmin': convert_to_feature(xmin),
        'image/object/bbox/xmax': convert_to_feature(xmax),
        'image/object/bbox/ymin': convert_to_feature(ymin),
        'image/object/bbox/ymax': convert_to_feature(ymax),
        'image/object/class/label': convert_to_feature(img_data['labels']),
        'image/encoded': convert_to_feature(img_data['pixel_data']),
        'image/format': convert_to_feature('jpeg'.encode('utf-8')),
    }))
    return example



def main(_):
    output_path = FLAGS.output_filepath[:FLAGS.output_filepath.rfind('/')]
    if not tf.io.gfile.isdir(output_path): 
      tf.io.gfile.makedirs(output_path)

    # load total coco data
    coco_data = load_coco_dection_dataset(FLAGS.image_dir,FLAGS.annotation_path,shuffle_img=FLAGS.shuffle_imgs)
    total_imgs = len(coco_data)
    # write coco data to tf record
    num_shards = FLAGS.shards

    

    writers = [
      tf.io.TFRecordWriter(
          FLAGS.output_filepath + '-%05d-of-%05d.tfrecord' % (i, num_shards))
      for i in range(num_shards)
    ]

    for index, img_data in enumerate(coco_data):
        # every 100 images log data
        if index % 100 == 0:
            print("Converting images: %d / %d" % (index, total_imgs))
        # make sure that every image has annotations, skip the ones that don't
        if len(img_data['bboxes']) != 0:
          example = dict_to_coco_example(img_data)
          writers[index % num_shards].write(example.SerializeToString())

    for writer in writers:
       writer.close()


if __name__ == "__main__":
    app.run(main)