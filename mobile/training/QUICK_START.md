# 🚀 Quick Start: Train Your Food AI in 30 Minutes

## Prerequisites

- Python 3.7+ installed
- 5 minutes to get free API keys

## Step 1: Get FREE API Keys (5 minutes)

### Unsplash (50 requests/hour)

1. Go to https://unsplash.com/developers
2. Sign up / Log in
3. Click "New Application"
4. Accept terms → Create application
5. Copy **Access Key** (starts with `G...` or similar)

### Pexels (200 requests/hour)

1. Go to https://www.pexels.com/api/
2. Sign up / Log in
3. Copy **API Key** (long string)

### Set Environment Variables

**Mac/Linux**:

```bash
export UNSPLASH_ACCESS_KEY="your_unsplash_access_key_here"
export PEXELS_API_KEY="your_pexels_api_key_here"
```

**Windows (PowerShell)**:

```powershell
$env:UNSPLASH_ACCESS_KEY="your_unsplash_access_key_here"
$env:PEXELS_API_KEY="your_pexels_api_key_here"
```

**Windows (CMD)**:

```cmd
set UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
set PEXELS_API_KEY=your_pexels_api_key_here
```

---

## Step 2: Install Dependencies (2 minutes)

```bash
cd mobile/training
pip install tensorflow pillow numpy matplotlib requests
```

---

## Step 3: Generate Labels from Database (1 minute)

Your app already has **350+ foods** with nutrition info. Generate labels:

```bash
python generate_labels_from_database.py
```

**Output**:

- `labels.txt` - 350+ food labels
- `class_mapping.json` - Nutrition data for each food
- Statistics report

---

## Step 4: Download Training Images (10 minutes)

Download 25 images for each of the 10 most common foods:

```bash
python download_food_images.py --tier1 --count 25
```

This downloads images for:

- plov, somsa, lagman, shashlik, manti
- non, shurva, chuchvara, norin, mastava

**Total**: 250 images (~10 minutes with rate limiting)

---

## Step 5: Train Model (20-40 minutes)

```bash
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

**With GPU**: 20-40 minutes  
**Without GPU**: 2-4 hours  
**Google Colab (free GPU)**: 30-50 minutes

**Output**:

- `model.tflite` - Trained AI model (~15MB)
- `best_model.h5` - Keras model (can resume training)
- `training_history.png` - Accuracy/loss charts

---

## Step 6: Deploy to Mobile (5 minutes)

### Android

```bash
cp model.tflite ../android/app/src/main/assets/
cp labels.txt ../android/app/src/main/assets/
cd ..
npx expo run:android
```

### iOS

1. Open `../ios/YourApp.xcworkspace` in Xcode
2. Drag `model.tflite` and `labels.txt` into project
3. Check "Copy items if needed"
4. Add to "Copy Bundle Resources"
5. Run from Xcode or:

```bash
cd ..
npx expo run:ios
```

---

## ✅ Done!

Your app now recognizes **10 foods** with **75-85% accuracy**!

---

## Next Steps

### Improve Accuracy

**Add more images** (50+ per food):

```bash
# Download more images
python download_food_images.py --food plov --count 50

# Or collect your own photos
# Add to: dataset/plov/photo_001.jpg, etc.

# Retrain
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

**Expected improvement**:

- 20 images → 75-85% accuracy
- 50 images → 85-92% accuracy
- 100 images → 90-95% accuracy

### Add More Foods

**Add Tier 2 foods** (10 more):

```bash
python download_food_images.py --tier2 --count 25
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

**Add specific food**:

```bash
python download_food_images.py --food "beef shashlik" --count 25
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

### Custom Foods (Uzbek/Regional)

For foods not found by APIs, collect your own:

1. Take 20-50 photos (various angles, lighting)
2. Save to: `dataset/your_food_name/photo_001.jpg`
3. Retrain model

---

## Troubleshooting

### "API key not set" error

Make sure you exported the environment variables in the **same terminal** where you run the script:

```bash
# Check if set
echo $UNSPLASH_ACCESS_KEY
echo $PEXELS_API_KEY

# If empty, export again
export UNSPLASH_ACCESS_KEY="your_key"
export PEXELS_API_KEY="your_key"
```

### "Not enough images" error

Need minimum 20 images per food. Check:

```bash
python collect_images.py --output dataset --analyze-only
```

Add more images:

- Re-run download with higher `--count`
- Add your own photos manually
- Use different search terms

### Low accuracy (<70%)

- **More images**: Collect 50-100 per food
- **Train longer**: `--epochs 100`
- **Fine-tune more layers**: `--trainable-layers 40`
- **Check image quality**: Remove blurry/wrong images

### Training too slow

**Use Google Colab (free GPU)**:

1. Go to https://colab.research.google.com
2. Create new notebook
3. Enable GPU: Runtime → Change runtime type → GPU
4. Upload your dataset as ZIP
5. Upload training script
6. Run training
7. Download model.tflite

See **[README.md](./README.md)** for detailed Colab instructions.

---

## Command Reference

```bash
# Generate labels from database
python generate_labels_from_database.py

# Download images
python download_food_images.py --tier1 --count 25
python download_food_images.py --tier2 --count 25
python download_food_images.py --food "plov" --count 50

# Validate dataset
python collect_images.py --output dataset --analyze-only

# Train model
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
python train_uzbek_food_model.py --dataset ./dataset --epochs 100 --trainable-layers 40

# Test model
python train_uzbek_food_model.py --test-image path/to/test.jpg
```

---

## Expected Results

| Foods | Images/Food | Training Time | Accuracy |
| ----- | ----------- | ------------- | -------- |
| 10    | 25          | 20 min        | 75-85%   |
| 20    | 25          | 40 min        | 80-88%   |
| 30    | 25          | 60 min        | 82-90%   |
| 10    | 50          | 25 min        | 85-92%   |
| 20    | 50          | 50 min        | 88-94%   |
| 30    | 50          | 75 min        | 90-96%   |

_With GPU. Without GPU: 5-10× longer_

---

## Support

- **Full Guide**: [FREE_DATASETS_GUIDE.md](./FREE_DATASETS_GUIDE.md)
- **Training Details**: [TRAINING_GUIDE.md](../TRAINING_GUIDE.md)
- **Dataset Tips**: [DATASET_EXAMPLE.md](./DATASET_EXAMPLE.md)

---

**Total time from zero to working AI**: ~30 minutes (with GPU) 🎉
