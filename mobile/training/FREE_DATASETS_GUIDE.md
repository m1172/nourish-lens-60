# Free Food Training Datasets Guide

This guide explains how to collect **FREE training images** for your food recognition AI using public APIs and datasets.

---

## 🎯 Quick Start (3 Methods)

### Method 1: Automated Download (Recommended)

Use our Python script with **FREE** image APIs:

```bash
# Step 1: Get FREE API keys (takes 5 minutes)
# Unsplash: https://unsplash.com/developers → Create App → Copy Access Key
# Pexels: https://www.pexels.com/api/ → Sign up → Get API Key

# Step 2: Set environment variables
export UNSPLASH_ACCESS_KEY="your_unsplash_key"
export PEXELS_API_KEY="your_pexels_key"

# Step 3: Download images
python download_food_images.py --tier1 --count 25

# This downloads 25 images for each of the 10 most common foods
# Total: 250 images in ~10 minutes
```

**Benefits**:

- ✅ Fully automated
- ✅ High-quality professional photos
- ✅ FREE (Unsplash: 50/hour, Pexels: 200/hour)
- ✅ Perfect for prototyping

**Limitations**:

- ⚠️ May not find specific Uzbek/regional foods
- ⚠️ Requires API keys (but they're free)
- ⚠️ Rate limited (collect in batches)

---

### Method 2: Manual Collection from Existing Datasets

Download pre-existing food datasets and filter relevant foods:

#### **Food-101** (101,000 images, 101 classes)

- **Source**: https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- **License**: Free for research
- **Download**: `wget http://data.vision.ee.ethz.ch/cvl/food-101.tar.gz`
- **Contains**: pizza, burger, pasta, sushi, etc.
- **Good for**: International common foods

```bash
# Extract relevant foods
tar -xzf food-101.tar.gz
cd food-101/images

# Copy relevant foods to your dataset
cp -r pizza ../../../dataset/
cp -r burger ../../../dataset/
cp -r french_fries ../../../dataset/
# etc.
```

#### **UECFOOD-256** (31,000 images, 256 Japanese foods)

- **Source**: http://foodcam.mobi/dataset256.html
- **License**: Free for research
- **Contains**: sushi, ramen, tempura, rice dishes
- **Good for**: Asian foods

#### **VireoFood-172** (110,000 images, 172 Chinese foods)

- **Source**: http://vireo.cs.cityu.edu.hk/VireoFood172/
- **License**: Free for research
- **Contains**: dumplings, noodles, rice dishes
- **Good for**: Chinese foods (similar to Central Asian)

---

### Method 3: Your Own Photos (Best Quality)

Collect photos yourself for **maximum accuracy**:

```bash
# Use your phone camera
# Tips:
# - Visit local restaurants
# - Photograph meals at home
# - Ask friends/family for photos
# - Use food delivery app screenshots

# Organize:
dataset/
├── plov/
│   ├── photo_001.jpg
│   ├── photo_002.jpg
│   └── ... (20+ photos)
├── samsa/
│   └── ... (20+ photos)
```

**Benefits**:

- ✅ Best accuracy (real-world conditions)
- ✅ Specific to your region/cuisine
- ✅ No copyright issues
- ✅ Free

**Limitations**:

- ⚠️ Time-consuming (1 week for 30 foods)
- ⚠️ Requires effort

---

## 📊 Food Database Already Included

**Great news!** Your app already has a comprehensive nutrition database with **350+ foods** including:

- **Uzbek foods** (40+): plov, samsa, lagman, shashlik, manti, etc.
- **Kazakh foods** (25+): beshbarmak, kuyrdak, baursak, etc.
- **Tajik foods** (15+): qurutob, oshi tupa, sambusa, etc.
- **Kyrgyz foods** (15+): boorsoq, shorpo, oromo, etc.
- **Turkmen foods** (12+): dograma, govurma, ichlekli, etc.
- **Russian/Soviet** (25+): pelmeni, borsch, blini, etc.
- **International** (200+): pizza, burger, pasta, sushi, etc.

All foods already have **complete nutrition info**:

- Calories per 100g
- Protein, carbs, fat
- Category (main dish, soup, bread, etc.)
- Local names (English, Uzbek, Russian, etc.)

**What you need**: Training images (20+ per food)  
**What you have**: Complete nutrition database ✅

---

## 🔄 Workflow: From Images to Working AI

### Step 1: Generate Labels from Database

Your database is the **source of truth**. Generate labels automatically:

```bash
cd mobile/training
python generate_labels_from_database.py
```

**Output**:

- `labels.txt` - 350+ food labels for TFLite model
- `class_mapping.json` - Nutrition info for each food
- Statistics report showing food categories

### Step 2: Collect Training Images

Choose your method:

**Option A: Automated (Quick)**

```bash
# Download 25 images per food for Tier 1 (10 foods)
python download_food_images.py --tier1 --count 25
```

**Option B: Manual (Best)**

```bash
# Collect your own photos
# Organize in dataset/ folder
# Run validation:
python collect_images.py --output dataset --analyze-only
```

**Option C: Mixed (Recommended)**

```bash
# Start with automated for common foods
python download_food_images.py --food pizza --count 25
python download_food_images.py --food burger --count 25

# Add your own photos for Uzbek foods
# (APIs may not have good results for regional foods)
```

### Step 3: Train Model

```bash
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

**Output**:

- `model.tflite` - Trained AI model
- Uses `labels.txt` generated from your database
- Automatic nutrition lookup from database

### Step 4: Deploy to Mobile

```bash
# Android
cp model.tflite ../android/app/src/main/assets/
cp labels.txt ../android/app/src/main/assets/

# iOS
# Drag files into Xcode project

# Rebuild app
cd ..
npx expo run:android
```

---

## 🎓 Understanding the Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘

1. NUTRITION DATABASE (nutritionDatabase.ts)
   ├─ 350+ foods with complete nutrition info
   ├─ Categories, local names, notes
   └─ ✅ ALREADY COMPLETE

2. GENERATE LABELS (generate_labels_from_database.py)
   ├─ Extracts food labels from database
   ├─ Creates labels.txt for TFLite
   ├─ Creates class_mapping.json with nutrition
   └─ ✅ RUN ONCE

3. COLLECT IMAGES (download_food_images.py or manual)
   ├─ 20+ images per food
   ├─ Organized in dataset/ folder
   └─ ⚠️  YOU NEED TO DO THIS

4. VALIDATE DATASET (collect_images.py)
   ├─ Checks image quality
   ├─ Removes duplicates
   ├─ Reports statistics
   └─ ✅ RUN BEFORE TRAINING

5. TRAIN MODEL (train_uzbek_food_model.py)
   ├─ Transfer learning from MobileNetV2
   ├─ Uses labels.txt from step 2
   ├─ Outputs model.tflite
   └─ ⚠️  REQUIRES STEP 3 COMPLETE

6. DEPLOY (manual copy to Android/iOS)
   ├─ Copy model.tflite to app
   ├─ App uses model + database for predictions
   └─ ⚠️  FINAL STEP
```

---

## 📸 Image Collection Best Practices

### Quantity Targets

| Priority   | Foods | Images/Food | Total | Time    |
| ---------- | ----- | ----------- | ----- | ------- |
| **Tier 1** | 10    | 25          | 250   | 1 week  |
| **Tier 2** | 10    | 25          | 250   | 1 week  |
| **Tier 3** | 10    | 25          | 250   | 1 week  |
| **Total**  | 30    | 25          | 750   | 3 weeks |

### Quality Guidelines

**Good Images**:

- ✅ Clear focus on food
- ✅ Various angles (top, side, closeup)
- ✅ Different lighting conditions
- ✅ Different portion sizes
- ✅ Different plate styles
- ✅ Minimum 224×224 pixels

**Bad Images**:

- ❌ Blurry or out of focus
- ❌ Food is tiny in frame
- ❌ Wrong food mislabeled
- ❌ Text/watermarks covering food
- ❌ Too dark/overexposed
- ❌ Duplicate images

---

## 🆓 Free Image Sources Summary

### **Automated APIs (Best for Quick Start)**

| Source        | Free Limit  | Quality    | Uzbek Foods                |
| ------------- | ----------- | ---------- | -------------------------- |
| **Unsplash**  | 50/hour     | ⭐⭐⭐⭐⭐ | ⭐⭐ (limited)             |
| **Pexels**    | 200/hour    | ⭐⭐⭐⭐   | ⭐⭐ (limited)             |
| **Pixabay**   | Unlimited\* | ⭐⭐⭐     | ⭐ (very limited)          |
| **Wikimedia** | Unlimited   | ⭐⭐⭐     | ⭐⭐⭐ (good for regional) |

\*Pixabay has API but requires attribution

### **Research Datasets (Best for Common Foods)**

| Dataset           | Foods | Images | License       | Download |
| ----------------- | ----- | ------ | ------------- | -------- |
| **Food-101**      | 101   | 101k   | Free research | 5GB      |
| **UECFOOD-256**   | 256   | 31k    | Free research | 2GB      |
| **VireoFood-172** | 172   | 110k   | Free research | 8GB      |
| **Recipe1M+**     | 1M+   | 1M+    | Free research | 40GB     |

### **Manual Collection (Best for Regional Foods)**

| Method                 | Cost | Time   | Quality    | Uzbek Foods |
| ---------------------- | ---- | ------ | ---------- | ----------- |
| **Your photos**        | Free | High   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  |
| **Restaurant visits**  | Free | Medium | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  |
| **Food delivery apps** | Free | Low    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐    |
| **Google Images**      | Free | Low    | ⭐⭐⭐     | ⭐⭐⭐      |

---

## 🚀 Quick Start Command Reference

```bash
# 1. Generate labels from your database
python generate_labels_from_database.py

# 2a. Download images automatically (requires API keys)
export UNSPLASH_ACCESS_KEY="your_key"
export PEXELS_API_KEY="your_key"
python download_food_images.py --tier1 --count 25

# 2b. Or collect manually and validate
python collect_images.py --output dataset --analyze-only

# 3. Train model
python train_uzbek_food_model.py --dataset ./dataset --epochs 50

# 4. Deploy to Android
cp model.tflite ../android/app/src/main/assets/
cp labels.txt ../android/app/src/main/assets/
cd .. && npx expo run:android
```

---

## 💡 Pro Tips

1. **Start small**: Begin with 10 foods (Tier 1), train, test, then expand
2. **Mix sources**: Use API for common foods, own photos for regional foods
3. **Quality > Quantity**: 20 good images beat 100 bad images
4. **Validate early**: Run `collect_images.py --analyze-only` before training
5. **Iterate**: Train → Test → Collect edge cases → Retrain

---

## 📞 Need Help?

Common issues:

**"API not finding my food"**

- Try different search terms
- Use manual collection for regional foods
- Check other languages (e.g., "uzbek plov" vs "pilaf")

**"Not enough images"**

- Combine multiple sources
- Ask community for contributions
- Use data augmentation (automatic in training)

**"Images are low quality"**

- Run validation script
- Manually review and delete bad images
- Adjust API search parameters

**"Training takes too long"**

- Use Google Colab (free GPU)
- Start with fewer foods
- Reduce --epochs (try 25 instead of 50)

---

## 🎯 Recommended Workflow for Beginners

**Week 1: Setup + Tier 1**

- Get API keys (5 minutes)
- Generate labels (1 minute)
- Download Tier 1 images (30 minutes)
- Collect own photos for 3-4 Uzbek foods (2 days)
- **Result**: 10 foods trained, 75-85% accuracy

**Week 2: Expand + Improve**

- Download Tier 2 images (30 minutes)
- Collect more Uzbek food photos (2 days)
- Retrain with 20 foods
- Test on real meals
- **Result**: 20 foods trained, 80-90% accuracy

**Week 3: Polish**

- Add edge cases and corrections
- Fine-tune model parameters
- Add remaining priority foods
- Deploy to production
- **Result**: 30 foods trained, 85-92% accuracy

---

Your nutrition database is already complete with 350+ foods and accurate calorie info. You just need training images to teach the AI to recognize them visually! 🎉
