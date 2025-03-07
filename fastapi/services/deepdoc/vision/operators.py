import cv2
import numpy as np

def decode_image(im_file, im_info):
    """read rgb image
    Args:
        im_file (str|np.ndarray): input can be image path or np.ndarray
        im_info (dict): info of image
    Returns:
        im (np.ndarray):  processed image (np.ndarray)
        im_info (dict): info of processed image
    """
    if isinstance(im_file, str):
        with open(im_file, 'rb') as f:
            im_read = f.read()
        data = np.frombuffer(im_read, dtype='uint8')
        im = cv2.imdecode(data, 1)  # BGR mode, but need RGB mode
        im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    else:
        im = im_file
    im_info['im_shape'] = np.array(im.shape[:2], dtype=np.float32)
    im_info['scale_factor'] = np.array([1., 1.], dtype=np.float32)
    return im, im_info

def preprocess(im, preprocess_ops):
    im_info = {
        'scale_factor': np.array(
            [1., 1.], dtype=np.float32),
        'im_shape': None,
    }
    im, im_info = decode_image(im, im_info)
    for operator in preprocess_ops:
        im, im_info = operator(im, im_info)
    return im, im_info