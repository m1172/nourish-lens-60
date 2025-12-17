#!/usr/bin/env python3
"""
Download free food training images from public sources
Uses Unsplash API and Pexels API (both have free tiers)

SETUP:
1. Get free API keys:
   - Unsplash: https://unsplash.com/developers (free, 50 requests/hour)
   - Pexels: https://www.pexels.com/api/ (free, 200 requests/hour)

2. Set environment variables:
   export UNSPLASH_ACCESS_KEY="your_key_here"
   export PEXELS_API_KEY="your_key_here"

3. Run:
   python download_food_images.py --food plov --count 25
"""
import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import List, Dict
import urllib.parse


def download_from_unsplash(query: str, count: int, output_dir: Path) -> int:
    """Download images from Unsplash (free tier: 50/hour)"""
    access_key = os.getenv('UNSPLASH_ACCESS_KEY')
    if not access_key:
        print("⚠️  UNSPLASH_ACCESS_KEY not set. Skipping Unsplash.")
        print("   Get free key: https://unsplash.com/developers")
        return 0
    
    print(f"Downloading from Unsplash: {query}")
    
    url = "https://api.unsplash.com/search/photos"
    headers = {"Authorization": f"Client-ID {access_key}"}
    
    downloaded = 0
    page = 1
    per_page = min(30, count)
    
    while downloaded < count and page <= 10:
        params = {
            "query": query,
            "page": page,
            "per_page": per_page,
            "orientation": "landscape"
        }
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            print(f"❌ Unsplash API error: {response.status_code}")
            break
        
        data = response.json()
        photos = data.get('results', [])
        
        if not photos:
            break
        
        for photo in photos:
            if downloaded >= count:
                break
            
            # Get regular size image URL
            img_url = photo['urls']['regular']
            img_id = photo['id']
            
            # Download image
            img_response = requests.get(img_url)
            if img_response.status_code == 200:
                filename = output_dir / f"unsplash_{img_id}.jpg"
                with open(filename, 'wb') as f:
                    f.write(img_response.content)
                downloaded += 1
                print(f"  ✓ Downloaded {downloaded}/{count}: {filename.name}")
            
            time.sleep(0.1)  # Rate limiting
        
        page += 1
        time.sleep(1)  # Rate limiting between pages
    
    return downloaded


def download_from_pexels(query: str, count: int, output_dir: Path) -> int:
    """Download images from Pexels (free tier: 200/hour)"""
    api_key = os.getenv('PEXELS_API_KEY')
    if not api_key:
        print("⚠️  PEXELS_API_KEY not set. Skipping Pexels.")
        print("   Get free key: https://www.pexels.com/api/")
        return 0
    
    print(f"Downloading from Pexels: {query}")
    
    url = "https://api.pexels.com/v1/search"
    headers = {"Authorization": api_key}
    
    downloaded = 0
    page = 1
    per_page = min(80, count)
    
    while downloaded < count and page <= 10:
        params = {
            "query": query,
            "page": page,
            "per_page": per_page,
            "orientation": "landscape"
        }
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            print(f"❌ Pexels API error: {response.status_code}")
            break
        
        data = response.json()
        photos = data.get('photos', [])
        
        if not photos:
            break
        
        for photo in photos:
            if downloaded >= count:
                break
            
            # Get large size image URL
            img_url = photo['src']['large']
            img_id = photo['id']
            
            # Download image
            img_response = requests.get(img_url)
            if img_response.status_code == 200:
                filename = output_dir / f"pexels_{img_id}.jpg"
                with open(filename, 'wb') as f:
                    f.write(img_response.content)
                downloaded += 1
                print(f"  ✓ Downloaded {downloaded}/{count}: {filename.name}")
            
            time.sleep(0.1)  # Rate limiting
        
        page += 1
        time.sleep(1)  # Rate limiting between pages
    
    return downloaded


def get_search_queries(food_label: str) -> List[str]:
    """Generate search queries with variations"""
    # Common food photo terms
    variations = [
        food_label,
        f"{food_label} food",
        f"{food_label} dish",
        f"{food_label} plate",
        f"{food_label} meal",
        f"uzbek {food_label}",
        f"central asian {food_label}"
    ]
    return variations


def download_food_images(food_label: str, count: int = 25, output_root: Path = Path("dataset")):
    """Download training images for a specific food"""
    output_dir = output_root / food_label
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*60}")
    print(f"Downloading images for: {food_label}")
    print(f"Target: {count} images")
    print(f"Output: {output_dir}")
    print(f"{'='*60}\n")
    
    # Check existing images
    existing = len(list(output_dir.glob("*.jpg"))) + len(list(output_dir.glob("*.png")))
    if existing >= count:
        print(f"✓ Already have {existing} images. Skipping.")
        return
    
    remaining = count - existing
    print(f"Existing: {existing}, Need: {remaining} more images\n")
    
    # Try different search queries
    queries = get_search_queries(food_label)
    total_downloaded = 0
    
    for query in queries:
        if total_downloaded >= remaining:
            break
        
        need = remaining - total_downloaded
        per_source = max(5, need // 2)  # Split between sources
        
        # Try Unsplash
        downloaded = download_from_unsplash(query, per_source, output_dir)
        total_downloaded += downloaded
        
        if total_downloaded >= remaining:
            break
        
        # Try Pexels
        downloaded = download_from_pexels(query, per_source, output_dir)
        total_downloaded += downloaded
        
        time.sleep(2)  # Rate limiting between queries
    
    final_count = existing + total_downloaded
    print(f"\n✓ {food_label}: {final_count}/{count} images")
    if final_count < count:
        print(f"  ⚠️  Still need {count - final_count} more images")
        print(f"     Consider manual collection or trying later")


def load_food_database() -> List[Dict[str, any]]:
    """Load food labels from class_mapping.json"""
    mapping_file = Path(__file__).parent / 'class_mapping.json'
    if not mapping_file.exists():
        print("Error: class_mapping.json not found")
        print("Run: python generate_labels_from_database.py")
        sys.exit(1)
    
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    return [{'label': label, **data} for label, data in mapping.items()]


def main():
    parser = argparse.ArgumentParser(
        description="Download free food training images from public APIs"
    )
    parser.add_argument(
        '--food',
        type=str,
        help='Food label to download (e.g., "plov", "samsa")'
    )
    parser.add_argument(
        '--count',
        type=int,
        default=25,
        help='Number of images to download per food (default: 25)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='dataset',
        help='Output directory (default: dataset)'
    )
    parser.add_argument(
        '--tier1',
        action='store_true',
        help='Download Tier 1 priority foods (10 most common)'
    )
    parser.add_argument(
        '--tier2',
        action='store_true',
        help='Download Tier 2 priority foods'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Download ALL foods from database (not recommended - very slow)'
    )
    
    args = parser.parse_args()
    
    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)
    
    # Check API keys
    unsplash_key = os.getenv('UNSPLASH_ACCESS_KEY')
    pexels_key = os.getenv('PEXELS_API_KEY')
    
    if not unsplash_key and not pexels_key:
        print("❌ ERROR: No API keys configured")
        print("\nTo use this script, you need FREE API keys from:")
        print("1. Unsplash: https://unsplash.com/developers")
        print("   - Sign up → Create app → Copy 'Access Key'")
        print("   - Set: export UNSPLASH_ACCESS_KEY='your_key'")
        print("\n2. Pexels: https://www.pexels.com/api/")
        print("   - Sign up → Get API key")
        print("   - Set: export PEXELS_API_KEY='your_key'")
        print("\nBoth are FREE with generous limits:")
        print("  - Unsplash: 50 requests/hour")
        print("  - Pexels: 200 requests/hour")
        sys.exit(1)
    
    # Priority food lists
    tier1_foods = ['plov', 'somsa', 'lagman', 'shashlik', 'manti', 'non', 'shurva', 'chuchvara', 'norin', 'mastava']
    tier2_foods = ['patir', 'dolma', 'achichuk', 'dimlama', 'qovurdoq', 'qazi', 'hasip', 'beshbarmak', 'pelmeni', 'borsch']
    
    # Determine what to download
    if args.tier1:
        foods = tier1_foods
        print(f"Downloading Tier 1 foods: {len(foods)} foods × {args.count} images")
    elif args.tier2:
        foods = tier2_foods
        print(f"Downloading Tier 2 foods: {len(foods)} foods × {args.count} images")
    elif args.all:
        db = load_food_database()
        foods = [f['label'] for f in db]
        print(f"⚠️  Downloading ALL foods: {len(foods)} foods × {args.count} images")
        print("This will take MANY hours. Consider starting with --tier1 instead.")
        confirm = input("Continue? [y/N]: ")
        if confirm.lower() != 'y':
            sys.exit(0)
    elif args.food:
        foods = [args.food]
    else:
        print("Error: Specify --food, --tier1, --tier2, or --all")
        parser.print_help()
        sys.exit(1)
    
    # Download images
    print(f"\nStarting download: {len(foods)} foods × {args.count} images each")
    print(f"Estimated time: {len(foods) * 2} minutes (with rate limiting)")
    print(f"{'='*60}\n")
    
    for i, food in enumerate(foods, 1):
        print(f"\n[{i}/{len(foods)}] Processing: {food}")
        try:
            download_food_images(food, args.count, output_root)
        except Exception as e:
            print(f"❌ Error downloading {food}: {e}")
            continue
    
    print(f"\n{'='*60}")
    print("DOWNLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"Output directory: {output_root}")
    print("\nNext steps:")
    print("1. Review images in dataset/ folder")
    print("2. Remove low-quality or incorrect images")
    print("3. Run: python collect_images.py --output dataset --analyze-only")
    print("4. If needed, manually add more images to classes with <20 images")
    print("5. Run training: python train_uzbek_food_model.py")


if __name__ == '__main__':
    main()
