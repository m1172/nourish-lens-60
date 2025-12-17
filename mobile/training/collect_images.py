#!/usr/bin/env python3
"""
Helper script to organize and validate food images for training

Usage:
    python collect_images.py --source ./raw_images --output ./dataset --min-images 20
"""

import os
import argparse
import shutil
from pathlib import Path
from PIL import Image
import hashlib

def get_image_hash(image_path):
    """
    Compute hash of image to detect duplicates
    """
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def validate_image(image_path, min_size=224):
    """
    Validate that image is readable and large enough
    Returns (is_valid, error_message)
    """
    try:
        img = Image.open(image_path)
        width, height = img.size
        
        if width < min_size or height < min_size:
            return False, f"Too small: {width}x{height} (min: {min_size}x{min_size})"
        
        if img.mode not in ['RGB', 'RGBA', 'L']:
            return False, f"Unsupported mode: {img.mode}"
        
        # Try to load the image data
        img.load()
        img.close()
        
        return True, None
    except Exception as e:
        return False, str(e)

def organize_images(source_dir, output_dir, min_images=20, min_size=224):
    """
    Organize images from source directory into training structure
    Expected source structure:
      source/
        plov/
          img1.jpg
          img2.jpg
        samsa/
          ...
    """
    print(f"Organizing images from {source_dir} to {output_dir}")
    print(f"Minimum images per class: {min_images}")
    print(f"Minimum image size: {min_size}x{min_size}")
    print("=" * 70)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    stats = {
        'total_classes': 0,
        'total_images': 0,
        'skipped_images': 0,
        'duplicates': 0,
        'invalid_images': 0
    }
    
    # Track image hashes to detect duplicates
    seen_hashes = {}
    
    # Process each food class
    for food_class in sorted(os.listdir(source_dir)):
        class_path = os.path.join(source_dir, food_class)
        
        if not os.path.isdir(class_path):
            continue
        
        print(f"\nProcessing: {food_class}")
        
        # Create output directory for this class
        output_class_dir = os.path.join(output_dir, food_class)
        os.makedirs(output_class_dir, exist_ok=True)
        
        # Process images in this class
        valid_images = 0
        class_duplicates = 0
        class_invalid = 0
        
        for filename in sorted(os.listdir(class_path)):
            file_path = os.path.join(class_path, filename)
            
            # Skip non-image files
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            
            # Validate image
            is_valid, error = validate_image(file_path, min_size)
            
            if not is_valid:
                print(f"  ⚠️  Skipping {filename}: {error}")
                class_invalid += 1
                continue
            
            # Check for duplicates
            img_hash = get_image_hash(file_path)
            
            if img_hash in seen_hashes:
                print(f"  ⚠️  Duplicate: {filename} (same as {seen_hashes[img_hash]})")
                class_duplicates += 1
                continue
            
            seen_hashes[img_hash] = f"{food_class}/{filename}"
            
            # Copy image to output directory
            output_path = os.path.join(output_class_dir, filename)
            shutil.copy2(file_path, output_path)
            valid_images += 1
        
        # Report stats for this class
        status = "✓" if valid_images >= min_images else "⚠️"
        print(f"  {status} Valid images: {valid_images}")
        
        if class_duplicates > 0:
            print(f"     Duplicates removed: {class_duplicates}")
        if class_invalid > 0:
            print(f"     Invalid images: {class_invalid}")
        
        if valid_images < min_images:
            print(f"     ⚠️  Warning: Need {min_images - valid_images} more images!")
        
        stats['total_classes'] += 1
        stats['total_images'] += valid_images
        stats['duplicates'] += class_duplicates
        stats['invalid_images'] += class_invalid
    
    # Print summary
    print("\n" + "=" * 70)
    print("Summary".center(70))
    print("=" * 70)
    print(f"  Total classes: {stats['total_classes']}")
    print(f"  Total valid images: {stats['total_images']}")
    print(f"  Duplicates removed: {stats['duplicates']}")
    print(f"  Invalid images skipped: {stats['invalid_images']}")
    print(f"  Average images per class: {stats['total_images'] / max(stats['total_classes'], 1):.1f}")
    
    # Check if dataset is ready for training
    print("\n" + "=" * 70)
    
    if stats['total_images'] == 0:
        print("❌ No valid images found!")
        print("   Check that source directory contains images in subdirectories.")
    elif stats['total_images'] < min_images * stats['total_classes']:
        print("⚠️  Dataset incomplete!")
        print(f"   Need at least {min_images} images per class.")
        print(f"   Add more images to classes with fewer than {min_images} images.")
    else:
        print("✓ Dataset is ready for training!")
        print(f"  Run: python train_uzbek_food_model.py --dataset {output_dir}")

def augment_small_classes(dataset_dir, min_images=20):
    """
    Suggest which classes need more images
    """
    print(f"\nAnalyzing dataset in {dataset_dir}...")
    print("=" * 70)
    
    needs_more = []
    
    for food_class in sorted(os.listdir(dataset_dir)):
        class_path = os.path.join(dataset_dir, food_class)
        
        if not os.path.isdir(class_path):
            continue
        
        image_count = len([f for f in os.listdir(class_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        
        if image_count < min_images:
            needs_more.append((food_class, image_count, min_images - image_count))
    
    if needs_more:
        print("Classes needing more images:\n")
        for food_class, current, needed in sorted(needs_more, key=lambda x: x[2], reverse=True):
            print(f"  • {food_class}: {current} images (need {needed} more)")
        
        print(f"\nTotal: {len(needs_more)} classes need more images")
    else:
        print("✓ All classes have at least {min_images} images!")

def main():
    parser = argparse.ArgumentParser(description='Organize and validate food images')
    parser.add_argument('--source', type=str, required=True,
                       help='Source directory with raw images')
    parser.add_argument('--output', type=str, default='dataset',
                       help='Output directory for organized dataset')
    parser.add_argument('--min-images', type=int, default=20,
                       help='Minimum images per class')
    parser.add_argument('--min-size', type=int, default=224,
                       help='Minimum image dimension (width or height)')
    parser.add_argument('--analyze-only', action='store_true',
                       help='Only analyze existing dataset without organizing')
    
    args = parser.parse_args()
    
    if args.analyze_only:
        augment_small_classes(args.output, args.min_images)
    else:
        organize_images(args.source, args.output, args.min_images, args.min_size)

if __name__ == '__main__':
    main()
