# Dataset Structure Example

This guide shows exactly how to organize your food images for training.

## Folder Structure

```
dataset/
├── plov/
│   ├── plov_001.jpg
│   ├── plov_002.jpg
│   ├── plov_003.jpg
│   ├── ... (20 images minimum)
│   └── plov_020.jpg
│
├── samsa/
│   ├── samsa_001.jpg
│   ├── samsa_002.jpg
│   ├── ... (20 images)
│   └── samsa_020.jpg
│
├── shashlik/
│   ├── shashlik_001.jpg
│   ├── ... (20 images)
│   └── shashlik_020.jpg
│
├── lagman/
│   ├── lagman_001.jpg
│   ├── ... (20 images)
│   └── lagman_020.jpg
│
├── manti/
│   ├── manti_001.jpg
│   ├── ... (20 images)
│   └── manti_020.jpg
│
├── non/
│   ├── non_001.jpg
│   ├── ... (20 images)
│   └── non_020.jpg
│
├── shurva/
│   ├── shurva_001.jpg
│   ├── ... (20 images)
│   └── shurva_020.jpg
│
├── chuchvara/
│   ├── chuchvara_001.jpg
│   ├── ... (20 images)
│   └── chuchvara_020.jpg
│
├── norin/
│   ├── norin_001.jpg
│   ├── ... (20 images)
│   └── norin_020.jpg
│
└── mastava/
    ├── mastava_001.jpg
    ├── ... (20 images)
    └── mastava_020.jpg
```

## Image Requirements

### File Format

- **Supported**: JPG, JPEG, PNG
- **Recommended**: JPG (smaller file size)

### Image Size

- **Minimum**: 224x224 pixels
- **Recommended**: 500x500 pixels or larger
- **Maximum**: No limit (will be resized automatically)

### Image Quality

- Clear, well-lit photos
- Food should be visible and in focus
- Different angles and perspectives
- Various plate styles and backgrounds

## Image Variety Examples

For each food (e.g., **plov**), collect images with variety:

### Angle Variety (8 images)

```
plov_001.jpg - Top-down view (overhead)
plov_002.jpg - 45-degree angle
plov_003.jpg - Side view
plov_004.jpg - Close-up (detail)
plov_005.jpg - Top-down, different lighting
plov_006.jpg - 45-degree, different plate
plov_007.jpg - Side view, restaurant setting
plov_008.jpg - Close-up, different portion
```

### Lighting Variety (4 images)

```
plov_009.jpg - Bright natural light
plov_010.jpg - Dim indoor lighting
plov_011.jpg - Yellow/warm lighting
plov_012.jpg - Flash photography
```

### Background/Plate Variety (4 images)

```
plov_013.jpg - White plate, plain background
plov_014.jpg - Colorful plate, patterned tablecloth
plov_015.jpg - Traditional Uzbek ceramics
plov_016.jpg - Restaurant table setting
```

### Portion Variety (4 images)

```
plov_017.jpg - Small portion (100g)
plov_018.jpg - Medium portion (200g)
plov_019.jpg - Large portion (300g)
plov_020.jpg - Extra large (500g+)
```

## Naming Convention

Use consistent naming:

```
{food_name}_{number}.jpg
```

Examples:

- `plov_001.jpg`, `plov_002.jpg`, `plov_003.jpg`
- `samsa_001.jpg`, `samsa_002.jpg`, `samsa_003.jpg`

**Avoid**:

- Spaces: `plov 1.jpg` ❌
- Special characters: `plov@1.jpg` ❌
- Mixed case: `Plov_001.jpg` ❌ (use lowercase)

## Priority Foods (Start Here)

### Tier 1: Essential Uzbek Foods (10 foods × 20 images = 200 images)

1. **plov** - National dish, rice with meat and carrots
2. **samsa** - Baked pastry with meat filling
3. **lagman** - Hand-pulled noodles with sauce
4. **shashlik** - Grilled meat skewers
5. **manti** - Large steamed dumplings
6. **non** - Traditional flatbread
7. **shurva** - Meat broth with vegetables
8. **chuchvara** - Small dumplings
9. **norin** - Cold noodle dish
10. **mastava** - Rice soup

### Tier 2: Common Foods (10 foods)

11. patir (layered bread)
12. dolma (stuffed vegetables)
13. achichuk (tomato salad)
14. dimlama (layered stew)
15. qovurdoq (fried meat with potatoes)
16. khalva (sweet confection)
17. qazi (horse meat sausage)
18. hasip (rice-stuffed sausage)
19. tukhum barak (egg dumplings)
20. naryn (hand-cut noodles)

## Quick Collection Guide

### Week 1: Core Foods

- Visit 2-3 Uzbek restaurants
- Take 20 photos per food
- Focus on Tier 1 (10 foods)
- Total: 200 images

### Week 2: Variations

- Cook at home
- Different presentations
- Add Tier 2 foods
- Total: +200 images

### Week 3: Edge Cases

- Poor lighting
- Messy plates
- Partial views
- Mixed dishes
- Total: +100 images

## Tips for Fast Collection

### At Restaurants

1. Order 3-4 dishes
2. Take 5 photos per dish (different angles)
3. Visit 3 restaurants = 60 images
4. Repeat 4 times = 240 images

### At Home

1. Cook one dish
2. Take 20 photos during preparation and serving
3. Different plates, lighting, angles
4. One cooking session = 20 images

### From Delivery Apps

1. Screenshot food photos (with permission)
2. Ask friends to share their meal photos
3. Use Google Images (cite sources)

## Image Sources

### Your Own Photos (Best)

- Most authentic
- Control quality
- Real-world variations

### Public Datasets

- Food-101: https://www.vision.ee.ethz.ch/datasets_extra/food-101/
- UECFOOD-256: http://foodcam.mobi/dataset256.html
- Check for Uzbek/Central Asian foods

### Web Sources (with permission)

- Unsplash (free commercial use)
- Instagram (public posts, with credit)
- Food blogs (ask permission)
- Restaurant websites (ask permission)

## Validation Checklist

Before training, verify:

- [ ] **Minimum 20 images per food**
- [ ] **All images are JPG or PNG**
- [ ] **All images are at least 224x224 pixels**
- [ ] **Each food has its own folder**
- [ ] **Folder names match nutrition database labels**
- [ ] **Images show clear, visible food**
- [ ] **Good variety in angles, lighting, backgrounds**
- [ ] **No duplicates (same exact photo)**

Run validation:

```bash
python collect_images.py --output ./dataset --analyze-only
```

## Common Mistakes to Avoid

### ❌ Don't Do This

```
dataset/
├── all_images/
│   ├── plov1.jpg
│   ├── samsa1.jpg
│   └── shashlik1.jpg  # All in one folder - WRONG!
```

### ❌ Too Few Images

```
dataset/
├── plov/
│   ├── plov_001.jpg
│   ├── plov_002.jpg
│   └── plov_003.jpg  # Only 3 images - WRONG!
```

### ❌ Wrong Names

```
dataset/
├── Plov/  # Capital letter - inconsistent
├── samsa-new/  # Hyphen - use underscore
└── shashlik meat/  # Space - use underscore
```

### ✅ Correct Structure

```
dataset/
├── plov/
│   ├── plov_001.jpg
│   ├── ... (20 images)
│   └── plov_020.jpg
├── samsa/
│   ├── samsa_001.jpg
│   ├── ... (20 images)
│   └── samsa_020.jpg
└── shashlik/
    ├── shashlik_001.jpg
    ├── ... (20 images)
    └── shashlik_020.jpg
```

## After Collecting Images

1. **Validate dataset**:

```bash
python collect_images.py --output ./dataset --analyze-only
```

2. **Train model**:

```bash
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

3. **Test model**:

```bash
python train_uzbek_food_model.py --test-image ./test_images/plov.jpg
```

4. **Deploy to mobile app** (see `../TFLITE_SETUP.md`)

## Expected Results

With 20 images per food:

- **Training accuracy**: 85-92%
- **Validation accuracy**: 75-85%
- **Top-3 accuracy**: 90-95%

With 50 images per food:

- **Training accuracy**: 92-97%
- **Validation accuracy**: 85-92%
- **Top-3 accuracy**: 95-98%

## Need Help?

- See `TRAINING_GUIDE.md` for detailed training instructions
- See `README.md` for script documentation
- See `../TFLITE_SETUP.md` for model integration

**Ready to train?** Follow the Quick Collection Guide above to gather 200 images in one week, then train your model!
