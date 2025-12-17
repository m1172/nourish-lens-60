#!/usr/bin/env python3
"""
Generate TFLite labels.txt from nutritionDatabase.ts
Automatically sync food labels between database and AI model
"""
import json
import re
from pathlib import Path
from typing import List, Dict


def extract_foods_from_typescript(ts_file: str) -> List[Dict[str, any]]:
    """Extract food items from TypeScript nutrition database"""
    with open(ts_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the nutritionDatabase array
    match = re.search(r'export const nutritionDatabase.*?=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find nutritionDatabase array")
    
    array_content = match.group(1)
    
    # Extract individual food entries (simple regex approach)
    foods = []
    # Match { label: "...", local_names: [...], category: "...", ... }
    food_pattern = r'\{\s*label:\s*"([^"]+)"[^}]+?category:\s*"([^"]+)"[^}]+?kcal_per_100g:\s*(\d+)[^}]+?protein_g:\s*([\d.]+)[^}]+?carbs_g:\s*([\d.]+)[^}]+?fat_g:\s*([\d.]+)[^}]+?notes:\s*"([^"]+)"'
    
    for match in re.finditer(food_pattern, array_content, re.DOTALL):
        label = match.group(1)
        category = match.group(2)
        kcal = int(match.group(3))
        protein = float(match.group(4))
        carbs = float(match.group(5))
        fat = float(match.group(6))
        notes = match.group(7)
        
        foods.append({
            'label': label,
            'category': category,
            'kcal_per_100g': kcal,
            'protein_g': protein,
            'carbs_g': carbs,
            'fat_g': fat,
            'notes': notes
        })
    
    return foods


def generate_labels_txt(foods: List[Dict[str, any]], output_path: str):
    """Generate labels.txt file for TFLite model"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for food in foods:
            f.write(f"{food['label']}\n")
    print(f"✓ Generated {output_path} with {len(foods)} food labels")


def generate_class_mapping_json(foods: List[Dict[str, any]], output_path: str):
    """Generate class mapping JSON with nutrition info"""
    mapping = {}
    for idx, food in enumerate(foods):
        mapping[food['label']] = {
            'index': idx,
            'category': food['category'],
            'kcal_per_100g': food['kcal_per_100g'],
            'protein_g': food['protein_g'],
            'carbs_g': food['carbs_g'],
            'fat_g': food['fat_g'],
            'notes': food['notes']
        }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"✓ Generated {output_path} with nutrition info for {len(foods)} foods")


def generate_category_report(foods: List[Dict[str, any]]):
    """Generate statistics report by category"""
    categories = {}
    for food in foods:
        cat = food['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(food['label'])
    
    print("\n" + "="*60)
    print("FOOD DATABASE STATISTICS")
    print("="*60)
    print(f"Total foods: {len(foods)}")
    print(f"Total categories: {len(categories)}\n")
    
    for cat, items in sorted(categories.items()):
        print(f"{cat:20s}: {len(items):3d} foods")
    
    print("\n" + "="*60)
    print("TOP 30 PRIORITY FOODS FOR INITIAL TRAINING")
    print("="*60)
    
    # Priority foods from DATASET_EXAMPLE.md
    tier1 = ['plov', 'somsa', 'lagman', 'shashlik', 'manti', 'non', 'shurva', 'chuchvara', 'norin', 'mastava']
    tier2 = ['patir', 'dolma', 'achichuk', 'dimlama', 'qovurdoq', 'qazi', 'hasip', 'beshbarmak', 'pelmeni', 'borsch']
    tier3 = ['wedding plov', 'tandoor somsa', 'fried lagman', 'beef shashlik', 'lamb shashlik', 'baursak', 'kuyrdak', 'shubat', 'kumys', 'kurut']
    
    print("\nTier 1 (Train First - 10 foods):")
    for food in tier1:
        if any(f['label'] == food for f in foods):
            print(f"  ✓ {food}")
        else:
            print(f"  ✗ {food} (NOT IN DATABASE)")
    
    print("\nTier 2 (Train Next - 10 foods):")
    for food in tier2:
        if any(f['label'] == food for f in foods):
            print(f"  ✓ {food}")
        else:
            print(f"  ✗ {food} (NOT IN DATABASE)")
    
    print("\nTier 3 (Train Last - 10 foods):")
    for food in tier3:
        if any(f['label'] == food for f in foods):
            print(f"  ✓ {food}")
        else:
            print(f"  ✗ {food} (NOT IN DATABASE)")


def main():
    script_dir = Path(__file__).parent
    db_path = script_dir.parent / 'src' / 'data' / 'nutritionDatabase.ts'
    
    if not db_path.exists():
        print(f"Error: {db_path} not found")
        return
    
    print(f"Reading nutrition database from: {db_path}")
    
    # Extract foods
    foods = extract_foods_from_typescript(str(db_path))
    print(f"Extracted {len(foods)} foods from database\n")
    
    # Generate outputs
    generate_labels_txt(foods, str(script_dir / 'labels.txt'))
    generate_class_mapping_json(foods, str(script_dir / 'class_mapping.json'))
    generate_category_report(foods)
    
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("1. Collect 20+ images per food (start with Tier 1)")
    print("2. Organize in dataset/ folder:")
    print("   dataset/plov/img1.jpg, dataset/plov/img2.jpg, etc.")
    print("3. Run training:")
    print("   python train_uzbek_food_model.py --dataset ./dataset --epochs 50")
    print("4. Model will use labels.txt generated by this script")
    print("5. Deploy model.tflite to Android/iOS")
    print("="*60)


if __name__ == '__main__':
    main()
