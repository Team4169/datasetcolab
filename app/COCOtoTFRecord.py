import collections
import json
import os

from absl import app
from absl import flags

from pycocotools import mask

import multiprocessing as mp
import tensorflow as tf

"""Helper functions for creating TFRecord datasets."""

import hashlib
import io
import itertools

from absl import logging
import numpy as np
from PIL import Image


LOG_EVERY = 100

flags.DEFINE_string(
  'annotation_info_file', '', 'File containing image annotations.'
)
flags.DEFINE_multi_string(
  'image_dir', '', 'Directory containing images.'
)
flags.DEFINE_string(
  'output_dir', '/tmp/train', 'Directory to store output file'
)
flags.DEFINE_integer(
  'shards', 1, 'Number of shards for output file'
)

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


def image_info_to_feature_dict(height, width, filename, image_id,
                               encoded_str, encoded_format):
  """Convert image information to a dict of features."""

  key = hashlib.sha256(encoded_str).hexdigest()

  return {
      'image/height': convert_to_feature(height),
      'image/width': convert_to_feature(width),
      'image/filename': convert_to_feature(filename.encode('utf8')),
      'image/source_id': convert_to_feature(str(image_id).encode('utf8')),
      'image/key/sha256': convert_to_feature(key.encode('utf8')),
      'image/encoded': convert_to_feature(encoded_str),
      'image/format': convert_to_feature(encoded_format.encode('utf8')),
  }


def read_image(image_path):
  pil_image = Image.open(image_path)
  return np.asarray(pil_image)


def encode_mask_as_png(mask):
  pil_image = Image.fromarray(mask)
  output_io = io.BytesIO()
  pil_image.save(output_io, format='PNG')
  return output_io.getvalue()


def write_tf_record_dataset(output_path, annotation_iterator,
                            process_func, num_shards,
                            multiple_processes=None, unpack_arguments=True):
  """Iterates over annotations, processes them and writes into TFRecords.

  Args:
    output_path: The prefix path to create TF record files.
    annotation_iterator: An iterator of tuples containing details about the
      dataset.
    process_func: A function which takes the elements from the tuples of
      annotation_iterator as arguments and returns a tuple of (tf.train.Example,
      int). The integer indicates the number of annotations that were skipped.
    num_shards: int, the number of shards to write for the dataset.
    multiple_processes: integer, the number of multiple parallel processes to
      use.  If None, uses multi-processing with number of processes equal to
      `os.cpu_count()`, which is Python's default behavior. If set to 0,
      multi-processing is disabled.
      Whether or not to use multiple processes to write TF Records.
    unpack_arguments:
      Whether to unpack the tuples from annotation_iterator as individual
        arguments to the process func or to pass the returned value as it is.

  Returns:
    num_skipped: The total number of skipped annotations.
  """

  writers = [
      tf.io.TFRecordWriter(
          output_path + '-%05d-of-%05d.tfrecord' % (i, num_shards))
      for i in range(num_shards)
  ]

  total_num_annotations_skipped = 0

  if multiple_processes is None or multiple_processes > 0:
    pool = mp.Pool(
        processes=multiple_processes)
    if unpack_arguments:
      tf_example_iterator = pool.starmap(process_func, annotation_iterator)
    else:
      tf_example_iterator = pool.imap(process_func, annotation_iterator)
  else:
    if unpack_arguments:
      tf_example_iterator = itertools.starmap(process_func, annotation_iterator)
    else:
      tf_example_iterator = map(process_func, annotation_iterator)

  for idx, (tf_example, num_annotations_skipped) in enumerate(
      tf_example_iterator):
    if idx % LOG_EVERY == 0:
      logging.info('On image %d', idx)

    total_num_annotations_skipped += num_annotations_skipped
    writers[idx % num_shards].write(tf_example.SerializeToString())

  if multiple_processes is None or multiple_processes > 0:
    pool.close()
    pool.join()

  for writer in writers:
    writer.close()

  logging.info('Finished writing, skipped %d annotations.',
               total_num_annotations_skipped)
  return total_num_annotations_skipped


def coco_segmentation_to_mask_png(segmentation, height, width, is_crowd):
  """Encode a COCO mask segmentation as PNG string."""
  run_len_encoding = mask.frPyObjects(segmentation, height, width)
  binary_mask = mask.decode(run_len_encoding)
  if not is_crowd:
    binary_mask = np.amax(binary_mask, axis=2)

  return encode_mask_as_png(binary_mask)

def coco_annotations_to_lists(bbox_annotations, id_to_name_map,
                              image_height, image_width, include_masks):
  """Converts COCO annotations to feature lists."""

  data = dict((k, list()) for k in
              ['xmin', 'xmax', 'ymin', 'ymax', 'is_crowd',
               'category_id', 'category_names', 'area'])
  if include_masks:
    data['encoded_mask_png'] = []

  num_annotations_skipped = 0

  for object_annotations in bbox_annotations:
    (x, y, width, height) = tuple(object_annotations['bbox'])

    if width <= 0 or height <= 0:
      num_annotations_skipped += 1
      continue
    if x + width > image_width or y + height > image_height:
      num_annotations_skipped += 1
      continue
    data['xmin'].append(float(x) / image_width)
    data['xmax'].append(float(x + width) / image_width)
    data['ymin'].append(float(y) / image_height)
    data['ymax'].append(float(y + height) / image_height)
    data['is_crowd'].append(object_annotations['iscrowd'])
    category_id = int(object_annotations['category_id'])
    data['category_id'].append(category_id)
    data['category_names'].append(id_to_name_map[category_id].encode('utf8'))
    data['area'].append(object_annotations['area'])

    if include_masks:
      data['encoded_mask_png'].append(
          coco_segmentation_to_mask_png(object_annotations['segmentation'],
                                        image_height, image_width,
                                        object_annotations['iscrowd'])
      )

  return data, num_annotations_skipped

def bbox_annotations_to_feature_dict(
    bbox_annotations, image_height, image_width, id_to_name_map, include_masks):
  """Convert COCO annotations to an encoded feature dict."""

  data, num_skipped = coco_annotations_to_lists(
      bbox_annotations, id_to_name_map, image_height, image_width,
      include_masks)
  feature_dict = {}
  if len(bbox_annotations) != num_skipped:
    feature_dict = {
        'image/object/bbox/xmin': convert_to_feature(data['xmin']),
        'image/object/bbox/xmax': convert_to_feature(data['xmax']),
        'image/object/bbox/ymin': convert_to_feature(data['ymin']),
        'image/object/bbox/ymax': convert_to_feature(data['ymax']),
        'image/object/class/text': convert_to_feature(
            data['category_names']
        ),
        'image/object/class/label': convert_to_feature(
            data['category_id']
        ),
        'image/object/is_crowd': convert_to_feature(
            data['is_crowd']
        ),
        'image/object/area': convert_to_feature(
            data['area'], 'float_list'
        ),
    }
    if include_masks:
      feature_dict['image/object/mask'] = convert_to_feature(
          data['encoded_mask_png']
      )

  return feature_dict, num_skipped

def encode_caption_annotations(caption_annotations):
  captions = []
  for caption_annotation in caption_annotations:
    captions.append(caption_annotation['caption'].encode('utf8'))

  return captions

def create_tf_example(image,
                      image_dirs,
                      panoptic_masks_dir=None,
                      bbox_annotations=None,
                      id_to_name_map=None,
                      caption_annotations=None,
                      panoptic_annotation=None,
                      is_category_thing=None,
                      include_panoptic_masks=False,
                      include_masks=False):
  """Converts image and annotations to a tf.Example proto.

  Args:
    image: dict with keys: [u'license', u'file_name', u'coco_url', u'height',
      u'width', u'date_captured', u'flickr_url', u'id']
    image_dirs: list of directories containing the image files.
    panoptic_masks_dir: `str` of the panoptic masks directory.
    bbox_annotations:
      list of dicts with keys: [u'segmentation', u'area', u'iscrowd',
        u'image_id', u'bbox', u'category_id', u'id'] Notice that bounding box
        coordinates in the official COCO dataset are given as [x, y, width,
        height] tuples using absolute coordinates where x, y represent the
        top-left (0-indexed) corner.  This function converts to the format
        expected by the Tensorflow Object Detection API (which is which is
        [ymin, xmin, ymax, xmax] with coordinates normalized relative to image
        size).
    id_to_name_map: a dict mapping category IDs to string names.
    caption_annotations:
      list of dict with keys: [u'id', u'image_id', u'str'].
    panoptic_annotation: dict with keys: [u'image_id', u'file_name',
      u'segments_info']. Where the value for segments_info is a list of dicts,
      with each dict containing information for a single segment in the mask.
    is_category_thing: `bool`, whether it is a category thing.
    include_panoptic_masks: `bool`, whether to include panoptic masks.
    include_masks: Whether to include instance segmentations masks
      (PNG encoded) in the result. default: False.

  Returns:
    example: The converted tf.Example
    num_annotations_skipped: Number of (invalid) annotations that were ignored.

  Raises:
    ValueError: if the image pointed to by data['filename'] is not a valid JPEG,
      does not exist, or is not unique across image directories.
  """
  image_height = image['height']
  image_width = image['width']
  filename = image['file_name']
  image_id = image['id']

  if len(image_dirs) > 1:
    full_paths = [os.path.join(image_dir, filename) for image_dir in image_dirs]
    full_existing_paths = [p for p in full_paths if tf.io.gfile.exists(p)]
    if not full_existing_paths:
      raise ValueError(
          '{} does not exist across image directories.'.format(full_paths))
    if len(full_existing_paths) > 1:
      raise ValueError(
          '{} is not unique across image directories'.format(filename))
    full_path, = full_existing_paths
  # If there is only one image directory, it's not worth checking for existence,
  # since trying to open the file will raise an informative error message if it
  # does not exist.
  else:
    image_dir, = image_dirs
    full_path = os.path.join(image_dir, filename)

  with tf.io.gfile.GFile(full_path, 'rb') as fid:
    encoded_jpg = fid.read()

  feature_dict = image_info_to_feature_dict(
      image_height, image_width, filename, image_id, encoded_jpg, 'jpg')

  num_annotations_skipped = 0
  if bbox_annotations:
    box_feature_dict, num_skipped = bbox_annotations_to_feature_dict(
        bbox_annotations, image_height, image_width, id_to_name_map,
        include_masks)
    num_annotations_skipped += num_skipped
    feature_dict.update(box_feature_dict)

  if caption_annotations:
    encoded_captions = encode_caption_annotations(caption_annotations)
    feature_dict.update(
        {'image/caption': convert_to_feature(encoded_captions)})

  if panoptic_annotation:
    segments_info = panoptic_annotation['segments_info']
    panoptic_mask_filename = os.path.join(
        panoptic_masks_dir,
        panoptic_annotation['file_name'])

  example = tf.train.Example(features=tf.train.Features(feature=feature_dict))
  return example, num_annotations_skipped


def _load_object_annotations(object_annotations_file):
  """Loads object annotation JSON file."""
  with tf.io.gfile.GFile(object_annotations_file, 'r') as fid:
    obj_annotations = json.load(fid)

  images = obj_annotations['images']
  id_to_name_map = dict((element['id'], element['name']) for element in
                        obj_annotations['categories'])

  img_to_obj_annotation = collections.defaultdict(list)
  for annotation in obj_annotations['annotations']:
    image_id = annotation['image_id']
    img_to_obj_annotation[image_id].append(annotation)

  missing_annotation_count = 0
  for image in images:
    image_id = image['id']
    if image_id not in img_to_obj_annotation:
      missing_annotation_count += 1

  return img_to_obj_annotation, id_to_name_map

def _load_images_info(images_info_file):
  with tf.io.gfile.GFile(images_info_file, 'r') as fid:
    info_dict = json.load(fid)
  return info_dict['images']

def generate_annotations(images, image_dirs,
                         panoptic_masks_dir=None,
                         img_to_obj_annotation=None,
                         img_to_caption_annotation=None,
                         img_to_panoptic_annotation=None,
                         is_category_thing=None,
                         id_to_name_map=None,
                         include_panoptic_masks=False,
                         include_masks=False):
  """Generator for COCO annotations."""
  for image in images:
    object_annotation = (img_to_obj_annotation.get(image['id'], None) if
                         img_to_obj_annotation else None)

    caption_annotaion = (img_to_caption_annotation.get(image['id'], None) if
                         img_to_caption_annotation else None)

    yield (image, image_dirs, panoptic_masks_dir, object_annotation,
           id_to_name_map, caption_annotaion, is_category_thing, include_panoptic_masks, include_masks)

def _create_tf_record_from_coco_annotations(images_info_file,
                                            image_dirs,
                                            output_path,
                                            object_annotations_file=None):
  """Loads COCO annotation json files and converts to tf.Record format.

  Args:
    images_info_file: JSON file containing image info. The number of tf.Examples
      in the output tf Record files is exactly equal to the number of image info
      entries in this file. This can be any of train/val/test annotation json
      files Eg. 'image_info_test-dev2017.json',
      'instance_annotations_train2017.json',
      'caption_annotations_train2017.json', etc.
    image_dirs: List of directories containing the image files.
    output_path: Path to output tf.Record file.
    object_annotations_file: JSON file containing bounding box annotations.
  """

  images = _load_images_info(images_info_file)

  img_to_obj_annotation = None
  img_to_caption_annotation = None
  id_to_name_map = None
  img_to_panoptic_annotation = None
  is_category_thing = None
  if object_annotations_file:
    img_to_obj_annotation, id_to_name_map = (
        _load_object_annotations(object_annotations_file))

  coco_annotations_iter = generate_annotations(
      images=images,
      image_dirs=image_dirs,
      img_to_obj_annotation=img_to_obj_annotation,
      img_to_caption_annotation=img_to_caption_annotation,
      img_to_panoptic_annotation=img_to_panoptic_annotation,
      is_category_thing=is_category_thing,
      id_to_name_map=id_to_name_map)

  num_skipped = write_tf_record_dataset(
      output_path, coco_annotations_iter, create_tf_example, num_shards=FLAGS.shards,
      multiple_processes=0)
  
 

def main(_):
  assert FLAGS.image_dir, '`image_dir` missing.'
  assert FLAGS.annotation_info_file, '`annotation_image_file` is missing'

  output_path = os.path.dirname(FLAGS.output_dir)

  if not tf.io.gfile.isdir(output_path): 
    tf.io.gfile.makedirs(output_path)

  _create_tf_record_from_coco_annotations(FLAGS.annotation_info_file, FLAGS.image_dir, FLAGS.output_dir, FLAGS.annotation_info_file)


if __name__ == '__main__':
  app.run(main)
