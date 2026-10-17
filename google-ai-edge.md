https://developers.google.com/edge/mediapipe/solutions/guide
model maker is deprecated
MediaPipe Solutions provides a suite of libraries and tools for you to quickly
apply artificial intelligence (AI) and machine learning (ML) techniques in your
applications. You can plug these solutions into your applications immediately,
customize them to your needs, and use them across multiple development
platforms. MediaPipe Solutions is part of the MediaPipe [open source
project](https://github.com/google/mediapipe), so you can further customize the
solutions code to meet your application needs. The MediaPipe Solutions suite
includes the following:

![MediaPipe
Solutions, Studio, and Model Maker](https://developers.google.com/static/edge/mediapipe/images/solutions/overview-diagram.svg)

These libraries and resources provide the core functionality for each MediaPipe
Solution:

- **MediaPipe Tasks** : Cross-platform APIs and libraries for deploying solutions. [Learn more](https://developers.google.com/edge/mediapipe/solutions/tasks)
- **MediaPipe Models**: Pre-trained, ready-to-run models for use with each solution.

These tools let you customize and evaluate solutions:

- **MediaPipe Model Maker** : Customize models for solutions with your data. [Learn
  more](https://developers.google.com/edge/mediapipe/solutions/model_maker)
- **MediaPipe Studio** : Visualize, evaluate, and benchmark solutions in your browser. [Learn
  more](https://developers.google.com/edge/mediapipe/solutions/studio)

## Available solutions

MediaPipe Solutions are available across multiple platforms. Each solution
includes one or more models, and you can customize models for some solutions as
well. The following list shows what solutions are available for each supported
platform and if you can use Model Maker to customize the model:

| Solution                                                                                                         | Android                                                                                             | Web                                                                                                 | Python                                                                                              | iOS                                                                                                 | Customize model                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Audio classification](https://developers.google.com/edge/mediapipe/solutions/audio/audio_classifier)            | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Face detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector)                    | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Face landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)         | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Gesture recognition](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer)          | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |
| [Hand landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)         | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Holistic landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Image classification](https://developers.google.com/edge/mediapipe/solutions/vision/image_classifier)           | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |
| [Image embedding](https://developers.google.com/edge/mediapipe/solutions/vision/image_embedder)                  | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Image segmentation](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)              | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Interactive segmentation](https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter)  | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Language detector](https://developers.google.com/edge/mediapipe/solutions/text/language_detector)               | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [LLM Inference API](https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference)                  |                                                                                                     | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |                                                                                                     | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |
| [Object detection](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector)                | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |
| [Pose landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)         | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Text classification](https://developers.google.com/edge/mediapipe/solutions/text/text_classifier)               | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |
| [Text embedding](https://developers.google.com/edge/mediapipe/solutions/text/text_embedder)                      | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Text proofreading](https://developers.google.com/edge/mediapipe/solutions/text/text_proofreader)                | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |
| [Text summarization](https://developers.google.com/edge/mediapipe/solutions/text/text_summarizer)                | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) | ![filled circle](https://developers.google.com/static/edge/mediapipe/images/mp_circle_mid_teal.svg) |                                                                                                     |

## Get started

You can get started with MediaPipe Solutions by selecting any of the tasks
listed in the left navigation tree, including
[vision](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector),
[text](https://developers.google.com/edge/mediapipe/solutions/text/text_classifier), and
[audio](https://developers.google.com/edge/mediapipe/solutions/audio/audio_classifier) tasks.
If you need help setting up a development environment for use with MediaPipe
Tasks, check out the setup guides for
[Android](https://developers.google.com/edge/mediapipe/solutions/setup_android),
[web apps](https://developers.google.com/edge/mediapipe/solutions/setup_web), and
[Python](https://developers.google.com/edge/mediapipe/solutions/setup_python).

## Legacy solutions

We have ended support for the MediaPipe Legacy Solutions listed below as of
March 1, 2023. All other MediaPipe Legacy Solutions will be upgraded to a new
MediaPipe Solution. See the list below for details. The
[code repository](https://github.com/google/mediapipe/tree/master/mediapipe) and
prebuilt binaries for all MediaPipe Legacy Solutions will continue to be
provided on an as-is basis.

| Legacy Solution                                                                                                             | Status                                                                                        | New MediaPipe Solution                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Face Detection ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/face_detection.md))                   | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector)       | [Face detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector)                    |
| Face Mesh ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/face_mesh.md))                             | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)     | [Face landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)         |
| Iris ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/iris.md))                                       | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)     | [Face landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)         |
| Hands ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/hands.md))                                     | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)     | [Hand landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)         |
| Pose ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md))                                       | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)     | [Pose landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)         |
| Holistic ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/holistic.md))                               | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker) | [Holistic landmark detection](https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker) |
| Selfie segmentation ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/selfie_segmentation.md))         | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)     | [Image segmentation](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)              |
| Hair segmentation ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/hair_segmentation.md))             | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)     | [Image segmentation](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)              |
| Object detection ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/object_detection.md))               | [Upgraded](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector)     | [Object detection](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector)                |
| Box tracking ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/box_tracking.md))                       | Support ended                                                                                 |                                                                                                                  |
| Instant motion tracking ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/instant_motion_tracking.md)) | Support ended                                                                                 |                                                                                                                  |
| Objectron ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/objectron.md))                             | Support ended                                                                                 |                                                                                                                  |
| KNIFT ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/knift.md))                                     | Support ended                                                                                 |                                                                                                                  |
| AutoFlip ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/autoflip.md))                               | Support ended                                                                                 |                                                                                                                  |
| MediaSequence ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/media_sequence.md))                    | Support ended                                                                                 |                                                                                                                  |
| YouTube 8M ([info](https://github.com/google/mediapipe/blob/master/docs/solutions/youtube_8m.md))                           | Support ended                                                                                 |                                                                                                                  |

The MediaPipe Gesture Recognizer task lets you recognize hand gestures in real time, and
provides the recognized hand gesture results and the hand landmarks of the
detected hands. These instructions show you how to use the Gesture Recognizer
for web and JavaScript apps.

You can see this task in action by viewing the
[demo](https://google-ai-edge.github.io/mediapipe-samples-web/#/vision/gesture_recognizer).
For more information about the capabilities, models, and configuration options
of this task, see the [Overview](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/index).

## Code example

The example code for Gesture Recognizer provides a complete implementation of this
task in JavaScript for your reference. This code helps you test this task and get
started on building your own gesture recognition app. You can view, run, and
edit the Gesture Recognizer
[example](https://stackblitz.com/github/google-ai-edge/mediapipe-samples-web?file=src/tasks/gesture-recognizer.ts)
using just your web browser.

## Setup

This section describes key steps for setting up your development environment
specifically to use Gesture Recognizer. For general information on
setting up your web and JavaScript development environment, including
platform version requirements, see the
[Setup guide for web](https://developers.google.com/mediapipe/solutions/setup_web).

### JavaScript packages

Gesture Recognizer code is available through the MediaPipe `@mediapipe/tasks-vision`
[NPM](https://www.npmjs.com/package/@mediapipe/tasks-vision) package. You can
find and download these libraries by following the instructions in the platform
[Setup guide](https://developers.google.com/mediapipe/solutions/setup_web#downloads).

You can install the required packages through NPM
using the following command:

    npm install @mediapipe/tasks-vision

If you want to import the task code via a content delivery network (CDN)
service, add the following code in the `<head>` tag in your HTML file:

    <!-- You can replace JSDeliver with another CDN if you prefer to -->
    <head>
      <script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs"
        crossorigin="anonymous"></script>
    </head>

### Model

The MediaPipe Gesture Recognizer task requires a trained model that is compatible with this
task. For more information on available trained models for Gesture Recognizer, see
the task overview [Models section](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/index#models).

Select and download the model, and then store it within your project directory:

    <dev-project-root>/app/shared/models/

## Create the task

Use one of the Gesture Recognizer `createFrom...()` functions to
prepare the task for running inferences. Use the `createFromModelPath()`
function with a relative or absolute path to the trained model file.
If your model is already loaded into memory, you can use the
`createFromModelBuffer()` method.

The code example below demonstrates using the `createFromOptions()` function to
set up the task. The `createFromOptions` function allows you to customize the
Gesture Recognizer with configuration options. For more information on configuration
options, see [Configuration options](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js#configuration_options).

The following code demonstrates how to build and configure the task with custom
options:

    // Create task for image file processing:
    const vision = await FilesetResolver.forVisionTasks(
      // path/to/wasm/root
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm "
    );
    const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
      },
      numHands: 2
    });

### Configuration options

This task has the following configuration options for Web applications:

| Option Name                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Value Range                                                                                                                                                                       | Default Value                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `runningMode`                        | Sets the running mode for the task. There are two modes: <br /> IMAGE: The mode for single image inputs. <br /> VIDEO: The mode for decoded frames of a video or on a livestream of input data, such as from a camera.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | {`IMAGE, VIDEO`}                                                                                                                                                                  | `IMAGE`                                                                                                                          |
| `num_hands`                          | The maximum number of hands can be detected by the `GestureRecognizer`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `Any integer > 0`                                                                                                                                                                 | `1`                                                                                                                              |
| `min_hand_detection_confidence`      | The minimum confidence score for the hand detection to be considered successful in palm detection model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `0.0 - 1.0`                                                                                                                                                                       | `0.5`                                                                                                                            |
| `min_hand_presence_confidence`       | The minimum confidence score of hand presence score in the hand landmark detection model. In Video mode and Live stream mode of Gesture Recognizer, if the hand presence confident score from the hand landmark model is below this threshold, it triggers the palm detection model. Otherwise, a lightweight hand tracking algorithm is used to determine the location of the hand(s) for subsequent landmark detection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `0.0 - 1.0`                                                                                                                                                                       | `0.5`                                                                                                                            |
| `min_tracking_confidence`            | The minimum confidence score for the hand tracking to be considered successful. This is the bounding box IoU threshold between hands in the current frame and the last frame. In Video mode and Stream mode of Gesture Recognizer, if the tracking fails, Gesture Recognizer triggers hand detection. Otherwise, the hand detection is skipped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `0.0 - 1.0`                                                                                                                                                                       | `0.5`                                                                                                                            |
| `canned_gestures_classifier_options` | Options for configuring the canned gestures classifier behavior. The canned gestures are `["None", "Closed_Fist", "Open_Palm", "Pointing_Up", "Thumb_Down", "Thumb_Up", "Victory", "ILoveYou"]` - Display names locale: the locale to use for display names specified through the TFLite Model Metadata, if any. - Max results: the maximum number of top-scored classification results to return. If \< 0, all available results will be returned. - Score threshold: the score below which results are rejected. If set to 0, all available results will be returned. - Category allowlist: the allowlist of category names. If non-empty, classification results whose category is not in this set will be filtered out. Mutually exclusive with denylist. - Category denylist: the denylist of category names. If non-empty, classification results whose category is in this set will be filtered out. Mutually exclusive with allowlist. | - Display names locale: `any string` - Max results: `any integer` - Score threshold: `0.0-1.0` - Category allowlist: `vector of strings` - Category denylist: `vector of strings` | - Display names locale: `"en"` - Max results: `-1` - Score threshold: `0` - Category allowlist: empty - Category denylist: empty |
| `custom_gestures_classifier_options` | Options for configuring the custom gestures classifier behavior. - Display names locale: the locale to use for display names specified through the TFLite Model Metadata, if any. - Max results: the maximum number of top-scored classification results to return. If \< 0, all available results will be returned. - Score threshold: the score below which results are rejected. If set to 0, all available results will be returned. - Category allowlist: the allowlist of category names. If non-empty, classification results whose category is not in this set will be filtered out. Mutually exclusive with denylist. - Category denylist: the denylist of category names. If non-empty, classification results whose category is in this set will be filtered out. Mutually exclusive with allowlist.                                                                                                                                | - Display names locale: `any string` - Max results: `any integer` - Score threshold: `0.0-1.0` - Category allowlist: `vector of strings` - Category denylist: `vector of strings` | - Display names locale: `"en"` - Max results: `-1` - Score threshold: `0` - Category allowlist: empty - Category denylist: empty |

## Prepare data

Gesture Recognizer can recognize gestures in images in any format supported by the
host browser. The task also handles data input preprocessing, including
resizing, rotation and value normalization. To recognize gestures in videos, you
can use the API to quickly process one frame at a time, using the timestamp of the
frame to determine when the gestures occur within the video.

## Run the task

The Gesture Recognizer uses the `recognize()` (with running mode `'image'`) and
`recognizeForVideo()` (with running mode `'video'`) methods to trigger
inferences. The task processes the data, attempts to recognize hand
gestures, and then reports the results.

The following code demonstrates how execute the processing with the task model:

### Image

```
const image = document.getElementById("image") as HTMLImageElement;
const gestureRecognitionResult = gestureRecognizer.recognize(image);
```

### Video

```
await gestureRecognizer.setOptions({ runningMode: "video" });

let lastVideoTime = -1;
function renderLoop(): void {
  const video = document.getElementById("video");

  if (video.currentTime !== lastVideoTime) {
    const gestureRecognitionResult = gestureRecognizer.recognizeForVideo(video);
    processResult(gestureRecognitionResult);
    lastVideoTime = video.currentTime;
  }

  requestAnimationFrame(() => {
    renderLoop();
  });
}
```

Calls to the Gesture Recognizer `recognize()` and `recognizeForVideo()` methods run
synchronously and block the user interface thread. If you recognize gestures in
video frames from a device's camera, each recognition will block the main
thread. You can prevent this by implementing web workers to run the
`recognize()` and `recognizeForVideo()` methods on another thread.

For a more complete implementation of running a Gesture Recognizer task, see the
[example](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/gesture-recognizer.worker.ts).

## Handle and display results

The Gesture Recognizer generates a gesture detection result object for each
recognition run. The result object contains hand landmarks in image coordinates,
hand landmarks in world coordinates, handedness(left/right hand), and hand
gestures categories of the detected hands.

The following shows an example of the output data from this task:

The resulted `GestureRecognizerResult` contains four components, and each component is an array, where each element contains the detected result of a single detected hand.

- Handedness

    Handedness represents whether the detected hands are left or right hands.

- Gestures

    The recognized gesture categories of the detected hands.

- Landmarks

    There are 21 hand landmarks, each composed of `x`, `y` and `z` coordinates. The
    `x` and `y` coordinates are normalized to \[0.0, 1.0\] by the image width and
    height, respectively. The `z` coordinate represents the landmark depth, with
    the depth at the wrist being the origin. The smaller the value, the closer the
    landmark is to the camera. The magnitude of `z` uses roughly the same scale as
    `x`.

- World Landmarks

    The 21 hand landmarks are also presented in world coordinates. Each landmark
    is composed of `x`, `y`, and `z`, representing real-world 3D coordinates in
    meters with the origin at the hand's geometric center.

    GestureRecognizerResult:
    Handedness:
    Categories #0:
    index : 0
    score : 0.98396
    categoryName : Left
    Gestures:
    Categories #0:
    score : 0.76893
    categoryName : Thumb_Up
    Landmarks:
    Landmark #0:
    x : 0.638852
    y : 0.671197
    z : -3.41E-7
    Landmark #1:
    x : 0.634599
    y : 0.536441
    z : -0.06984
    ... (21 landmarks for a hand)
    WorldLandmarks:
    Landmark #0:
    x : 0.067485
    y : 0.031084
    z : 0.055223
    Landmark #1:
    x : 0.063209
    y : -0.00382
    z : 0.020920
    ... (21 world landmarks for a hand)

The following images shows a visualization of the task output:

![A hand in a thumbs up motion with the skeletal structure of the hand mapped](https://developers.google.com/static/mediapipe/images/solutions/gesture-recognizer.png)

For a more complete implementation of creating a Gesture Recognizer task, see the
[example](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/tasks/gesture-recognizer.ts).
Holistic landmark detection guide for Web

The MediaPipe Holistic Landmarker task lets you combine components of the face, hand, and pose landmarkers to detect human body landmarks in images or video. This task outputs holistic landmarks in normalized image coordinates and 3D world coordinates.

These instructions show you how to use the Holistic Landmarker for web and JavaScript apps. For more information about the capabilities, models, and configuration options of this task, see the Overview.

Code example

The example code for Holistic Landmarker provides a complete implementation of this task in JavaScript for your reference. This code helps you test this task and get started on building your own holistic landmarker app. You can view, run, and edit the Holistic Landmarker example using just your web browser.

Setup

This section describes key steps for setting up your development environment specifically to use Holistic Landmarker. For general information on setting up your web and JavaScript development environment, including platform version requirements, see the Setup guide for web.

JavaScript packages

Holistic Landmarker code is available through the MediaPipe @mediapipe/tasks-vision NPM package. You can find and download these libraries by following the instructions in the platform Setup guide.

You can install the required packages through NPM using the following command:

npm install @mediapipe/tasks-vision
If you want to import the task code via a content delivery network (CDN) service, add the following code in the <head> tag in your HTML file:

<!-- You can replace JSDeliver with another CDN if you prefer -->
<head>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs"
    crossorigin="anonymous"></script>
</head>
Model

The MediaPipe Holistic Landmarker task requires a trained model bundle that is compatible with this task. For more information on available trained models for Holistic Landmarker, see the task overview Models section.

Select and download a model, and then store it within your project directory:

<dev-project-root>/app/shared/models/
Create the task

Use one of the Holistic Landmarker createFrom...() functions to prepare the task for running inferences. Use the createFromModelPath() function with a relative or absolute path to the trained model file. If your model is already loaded into memory, you can use the createFromModelBuffer() method.

The code example below demonstrates using the createFromOptions() function to set up the task. The createFromOptions() function allows you to customize the Holistic Landmarker with configuration options. For more information on configuration options, see Configuration options.

The following code demonstrates how to build and configure the task with custom options:

const vision = await FilesetResolver.forVisionTasks(
// path/to/wasm/root
"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
);
const holisticLandmarker = await HolisticLandmarker.createFromOptions(
vision,
{
baseOptions: {
modelAssetPath: "path/to/model"
},
minFaceDetectionConfidence: 0.5,
minPoseDetectionConfidence: 0.5,
minHandLandmarksConfidence: 0.5,
runningMode: runningMode
});
Configuration options

This task has the following configuration options for Web and JavaScript applications:

Option Name Description Value Range Default Value
runningMode Sets the running mode for the task. There are two modes:

IMAGE: The mode for single image inputs.

VIDEO: The mode for decoded frames of a video or on a livestream of input data, such as from a camera. {IMAGE, VIDEO} IMAGE
minFaceDetectionConfidence The minimum confidence score for the face detection to be considered successful. Float [0.0, 1.0] 0.5
minFaceSuppressionThreshold The minimum non-maximum-suppression threshold for face detection to be considered overlapped. Float [0.0, 1.0] 0.3
minFacePresenceConfidence The minimum confidence score of face presence score in the face landmarks detection. Float [0.0, 1.0] 0.5
minPoseDetectionConfidence The minimum confidence score for the pose detection to be considered successful. Float [0.0, 1.0] 0.5
minPoseSuppressionThreshold The minimum non-maximum-suppression threshold for pose detection to be considered overlapped. Float [0.0, 1.0] 0.3
minPosePresenceConfidence The minimum confidence score of pose presence score in the pose landmarks detection. Float [0.0, 1.0] 0.5
minHandLandmarksConfidence The minimum confidence score of hand presence score in the hand landmarks detection. Float [0.0, 1.0] 0.5
outputFaceBlendshapes Whether to output face blendshapes classification. Face blendshapes are used for rendering the 3D face model. Boolean false
outputPoseSegmentationMasks Whether to output segmentation masks for the human pose. Boolean false
Prepare data

Holistic Landmarker can detect holistic landmarks in images in any format supported by the host browser. The task also handles data input preprocessing, including resizing, rotation and value normalization. To detect landmarks in videos, you can use the API to quickly process one frame at a time, using the timestamp of the frame to determine when the landmarks occur within the video.

Run the task

The Holistic Landmarker uses the detect() (with running mode IMAGE) and detectForVideo() (with running mode VIDEO) methods to trigger inferences. The task processes the data, attempts to detect landmarks, and then reports the results.

The following code demonstrates how to execute the processing:

Image
Video

const image = document.getElementById("image") as HTMLImageElement;
const result = holisticLandmarker.detect(image);

await holisticLandmarker.setOptions({ runningMode: "VIDEO" });

let lastVideoTime = -1;
function renderLoop(): void {
const video = document.getElementById("video") as HTMLVideoElement;
if (video.currentTime !== lastVideoTime) {
const result = holisticLandmarker.detectForVideo(video, video.currentTime);
lastVideoTime = video.currentTime;
}
requestAnimationFrame(renderLoop);
}
