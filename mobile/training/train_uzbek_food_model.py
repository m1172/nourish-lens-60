#!/usr/bin/env python3
"""
Train a custom TFLite model for Uzbek food recognition
Supports transfer learning from MobileNetV2

Usage:
    python train_uzbek_food_model.py --dataset ./dataset --epochs 50
"""

import os
import argparse
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import numpy as np
import json
import matplotlib.pyplot as plt

# Default configuration
DEFAULT_IMG_SIZE = 224
DEFAULT_BATCH_SIZE = 16
DEFAULT_EPOCHS = 50
DEFAULT_VALIDATION_SPLIT = 0.2

def create_model(num_classes, trainable_layers=20):
    """
    Create a MobileNetV2 transfer learning model
    
    Args:
        num_classes: Number of food classes
        trainable_layers: Number of top layers to fine-tune (0 = freeze all)
    """
    # Load pre-trained MobileNetV2 (trained on ImageNet)
    base_model = MobileNetV2(
        input_shape=(DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze most layers, fine-tune top layers
    base_model.trainable = True
    for layer in base_model.layers[:-trainable_layers]:
        layer.trainable = False
    
    print(f"Trainable layers: {trainable_layers}/{len(base_model.layers)}")
    
    # Add custom classifier
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def create_data_generators(dataset_dir, batch_size=DEFAULT_BATCH_SIZE, val_split=DEFAULT_VALIDATION_SPLIT):
    """
    Create augmented data generators for training
    Augmentation helps with small datasets
    """
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest',
        validation_split=val_split
    )
    
    # Load training data
    train_generator = train_datagen.flow_from_directory(
        dataset_dir,
        target_size=(DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE),
        batch_size=batch_size,
        class_mode='categorical',
        subset='training',
        shuffle=True
    )
    
    # Load validation data (no augmentation)
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=val_split
    )
    
    val_generator = val_datagen.flow_from_directory(
        dataset_dir,
        target_size=(DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE),
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )
    
    return train_generator, val_generator

def plot_training_history(history, output_file='training_history.png'):
    """
    Plot training metrics
    """
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    
    # Plot accuracy
    axes[0].plot(history.history['accuracy'], label='Train')
    axes[0].plot(history.history['val_accuracy'], label='Validation')
    axes[0].set_title('Model Accuracy')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend()
    axes[0].grid(True)
    
    # Plot loss
    axes[1].plot(history.history['loss'], label='Train')
    axes[1].plot(history.history['val_loss'], label='Validation')
    axes[1].set_title('Model Loss')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"Training plot saved to {output_file}")

def train_model(dataset_dir, epochs=DEFAULT_EPOCHS, batch_size=DEFAULT_BATCH_SIZE, trainable_layers=20):
    """
    Main training function
    """
    print("Creating data generators...")
    train_gen, val_gen = create_data_generators(dataset_dir, batch_size)
    
    num_classes = len(train_gen.class_indices)
    class_names = list(train_gen.class_indices.keys())
    
    print(f"\nFound {num_classes} food classes:")
    for i, name in enumerate(class_names):
        print(f"  {i}: {name}")
    
    print(f"\nTraining images: {train_gen.samples}")
    print(f"Validation images: {val_gen.samples}")
    
    # Create model
    print("\nCreating model...")
    model = create_model(num_classes, trainable_layers=trainable_layers)
    
    # Compile with optimizer
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
    )
    
    print("\nModel architecture:")
    model.summary()
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            'best_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001,
            verbose=1
        )
    ]
    
    # Train
    print("\nStarting training...")
    history = model.fit(
        train_gen,
        epochs=epochs,
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save class names
    with open('labels.txt', 'w', encoding='utf-8') as f:
        for name in class_names:
            f.write(f"{name}\n")
    
    print(f"\nLabels saved to labels.txt")
    
    # Save class mapping as JSON
    class_mapping = {name: idx for idx, name in enumerate(class_names)}
    with open('class_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(class_mapping, f, indent=2, ensure_ascii=False)
    
    print(f"Class mapping saved to class_mapping.json")
    
    # Evaluate
    print("\nEvaluating model...")
    val_loss, val_acc, val_top3 = model.evaluate(val_gen)
    print(f"Final validation accuracy: {val_acc:.2%}")
    print(f"Final validation top-3 accuracy: {val_top3:.2%}")
    
    # Plot training history
    plot_training_history(history)
    
    return model, class_names, history

def convert_to_tflite(model, quantize=True, output_file='model.tflite'):
    """
    Convert Keras model to TFLite format
    
    Args:
        model: Trained Keras model
        quantize: Apply int8 quantization for smaller size and faster inference
        output_file: Output filename
    """
    print("\nConverting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    
    if quantize:
        print("Applying dynamic range quantization (int8)...")
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
    
    tflite_model = converter.convert()
    
    # Save model
    with open(output_file, 'wb') as f:
        f.write(tflite_model)
    
    file_size_mb = len(tflite_model) / (1024 * 1024)
    print(f"TFLite model saved to {output_file} ({file_size_mb:.2f} MB)")
    
    return output_file

def test_tflite_model(model_path, test_image_path, labels_path='labels.txt'):
    """
    Test the TFLite model on a single image
    """
    print(f"\nTesting model on: {test_image_path}")
    
    # Load TFLite model
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Load and preprocess image
    img = tf.keras.preprocessing.image.load_img(
        test_image_path,
        target_size=(DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE)
    )
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, 0) / 255.0
    
    # Run inference
    import time
    start_time = time.time()
    interpreter.set_tensor(input_details[0]['index'], img_array.astype(np.float32))
    interpreter.invoke()
    inference_time = (time.time() - start_time) * 1000
    
    # Get predictions
    predictions = interpreter.get_tensor(output_details[0]['index'])[0]
    
    # Load labels
    with open(labels_path, 'r', encoding='utf-8') as f:
        labels = [line.strip() for line in f]
    
    # Top 5 predictions
    top_indices = np.argsort(predictions)[-5:][::-1]
    
    print(f"Inference time: {inference_time:.1f}ms")
    print("\nTop 5 predictions:")
    for idx in top_indices:
        print(f"  {labels[idx]}: {predictions[idx]:.2%}")
    
    return predictions

def scan_dataset(dataset_dir):
    """
    Scan dataset and show statistics
    """
    print(f"Scanning dataset in '{dataset_dir}'...")
    
    total_images = 0
    min_images = float('inf')
    max_images = 0
    class_counts = []
    
    for food_dir in sorted(os.listdir(dataset_dir)):
        food_path = os.path.join(dataset_dir, food_dir)
        if os.path.isdir(food_path):
            image_count = len([f for f in os.listdir(food_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            total_images += image_count
            min_images = min(min_images, image_count)
            max_images = max(max_images, image_count)
            class_counts.append((food_dir, image_count))
            
            status = "✓" if image_count >= 20 else "⚠️"
            print(f"  {status} {food_dir}: {image_count} images")
    
    print(f"\nDataset statistics:")
    print(f"  Total classes: {len(class_counts)}")
    print(f"  Total images: {total_images}")
    print(f"  Images per class: {min_images}-{max_images} (avg: {total_images/len(class_counts):.1f})")
    
    # Warn about imbalanced dataset
    if max_images > min_images * 2:
        print(f"\n⚠️  Warning: Dataset is imbalanced!")
        print(f"  Some classes have 2x more images than others.")
        print(f"  Consider balancing by adding more images to smaller classes.")

def main():
    parser = argparse.ArgumentParser(description='Train Uzbek food recognition model')
    parser.add_argument('--dataset', type=str, default='dataset', 
                       help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=DEFAULT_EPOCHS,
                       help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE,
                       help='Batch size for training')
    parser.add_argument('--trainable-layers', type=int, default=20,
                       help='Number of top layers to fine-tune')
    parser.add_argument('--quantize', action='store_true', default=True,
                       help='Apply quantization to TFLite model')
    parser.add_argument('--test-image', type=str, default=None,
                       help='Test image path for inference demo')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Uzbek Food Recognition Model Training".center(70))
    print("=" * 70)
    
    # Check if dataset exists
    if not os.path.exists(args.dataset):
        print(f"\n❌ ERROR: Dataset directory '{args.dataset}' not found!")
        print("Please create the dataset structure as shown in TRAINING_GUIDE.md")
        return
    
    # Scan dataset
    scan_dataset(args.dataset)
    
    print("\n" + "=" * 70)
    print("Training Configuration".center(70))
    print("=" * 70)
    print(f"  Dataset: {args.dataset}")
    print(f"  Epochs: {args.epochs}")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Trainable layers: {args.trainable_layers}")
    print(f"  Image size: {DEFAULT_IMG_SIZE}x{DEFAULT_IMG_SIZE}")
    print(f"  Quantization: {'Enabled' if args.quantize else 'Disabled'}")
    print("=" * 70)
    
    # Train model
    model, class_names, history = train_model(
        args.dataset, 
        epochs=args.epochs,
        batch_size=args.batch_size,
        trainable_layers=args.trainable_layers
    )
    
    # Convert to TFLite
    tflite_path = convert_to_tflite(model, quantize=args.quantize)
    
    # Test on sample image
    test_image = args.test_image
    if not test_image:
        # Find first image in dataset
        for food_dir in os.listdir(args.dataset):
            food_path = os.path.join(args.dataset, food_dir)
            if os.path.isdir(food_path):
                images = [f for f in os.listdir(food_path) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_image = os.path.join(food_path, images[0])
                    break
    
    if test_image and os.path.exists(test_image):
        test_tflite_model(tflite_path, test_image)
    
    print("\n" + "=" * 70)
    print("Training Complete!".center(70))
    print("=" * 70)
    print(f"\nGenerated files:")
    print(f"  ✓ best_model.h5 - Keras model (for further training)")
    print(f"  ✓ model.tflite - TFLite model (for mobile deployment)")
    print(f"  ✓ labels.txt - Class names (one per line)")
    print(f"  ✓ class_mapping.json - Class name to index mapping")
    print(f"  ✓ training_history.png - Training metrics plot")
    
    print(f"\nNext steps:")
    print(f"  1. Review training_history.png to check for overfitting")
    print(f"  2. Test model.tflite on new images not in dataset")
    print(f"  3. Copy model.tflite and labels.txt to React Native project:")
    print(f"     - Android: mobile/android/app/src/main/assets/")
    print(f"     - iOS: Add to Xcode project resources")
    print(f"  4. See TFLITE_SETUP.md for integration instructions")
    print(f"  5. Rebuild app: npx expo run:android / npx expo run:ios")
    print("=" * 70)

if __name__ == '__main__':
    main()
