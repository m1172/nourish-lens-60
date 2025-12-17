# Training Scripts for Uzbek Food Recognition

This directory contains scripts to train a custom TFLite model for recognizing Uzbek and Central Asian foods.

## Quick Start

### 1. Prepare Your Dataset

Create a `dataset` folder with 20+ images per food:

```
dataset/
├── plov/
│   ├── plov_001.jpg
│   ├── plov_002.jpg
│   └── ... (20 images minimum)
├── samsa/
│   ├── samsa_001.jpg
│   └── ... (20 images)
├── shashlik/
│   └── ... (20 images)
└── ... (more foods)
```

### 2. Install Dependencies

```bash
pip install tensorflow pillow numpy matplotlib
```

### 3. Train Model

```bash
python train_uzbek_food_model.py --dataset ./dataset --epochs 50
```

### 4. Integrate Model

After training, copy generated files:

**Android**:

```bash
cp model.tflite ../android/app/src/main/assets/
cp labels.txt ../android/app/src/main/assets/
```

**iOS**:

- Open `../ios/YourApp.xcworkspace` in Xcode
- Drag `model.tflite` and `labels.txt` into project
- Check "Copy items if needed"
- Add to "Copy Bundle Resources"

### 5. Rebuild App

```bash
cd ..
npx expo run:android
# or
npx expo run:ios
```

---

## Scripts

### `train_uzbek_food_model.py`

Main training script with transfer learning from MobileNetV2.

**Options**:

- `--dataset` - Dataset directory (default: `dataset`)
- `--epochs` - Training epochs (default: 50)
- `--batch-size` - Batch size (default: 16)
- `--trainable-layers` - Fine-tune top N layers (default: 20)
- `--quantize` - Apply int8 quantization (default: True)
- `--test-image` - Test image path for demo

**Example**:

```bash
python train_uzbek_food_model.py \
  --dataset ./my_foods \
  --epochs 100 \
  --trainable-layers 30
```

**Output**:

- `best_model.h5` - Keras model (can resume training)
- `model.tflite` - TFLite model for mobile
- `labels.txt` - Class names (one per line)
- `class_mapping.json` - Class indices
- `training_history.png` - Training metrics plot

---

### `collect_images.py`

Helper script to organize and validate images.

**Features**:

- Validates image format and size
- Removes duplicate images
- Checks minimum images per class
- Reports dataset statistics

**Usage**:

```bash
python collect_images.py \
  --source ./raw_images \
  --output ./dataset \
  --min-images 20 \
  --min-size 224
```

**Example workflow**:

1. Download images to `raw_images/` folder with subfolders per food
2. Run `collect_images.py` to validate and organize
3. Add more images to classes with <20 images
4. Run `train_uzbek_food_model.py`

**Analyze existing dataset**:

```bash
python collect_images.py --output ./dataset --analyze-only
```

---

## Training Tips

### Start Small

Begin with 10 most common foods:

1. plov
2. samsa
3. lagman
4. shashlik
5. manti
6. non (bread)
7. shurva
8. chuchvara
9. norin
10. mastava

### Data Collection

- **Quantity**: 20-50 images per food (more is better)
- **Variety**: Different angles, lighting, plate styles
- **Quality**: Clear photos, 224x224 pixels minimum
- **Sources**: Your own photos, restaurants, food delivery apps

### Expected Results

- **20 images/class**: 75-85% accuracy
- **50 images/class**: 85-92% accuracy
- **100 images/class**: 90-95% accuracy

### Training Time

- **With GPU**: 20-40 minutes for 30 classes, 50 epochs
- **Without GPU**: 2-4 hours
- **Google Colab (free GPU)**: 30-50 minutes

---

## Google Colab (Free GPU Training)

If you don't have a GPU, use Google Colab:

1. Go to https://colab.research.google.com
2. Create new notebook
3. Enable GPU: Runtime → Change runtime type → GPU
4. Run:

```python
# Install dependencies
!pip install tensorflow pillow matplotlib

# Upload dataset (or use Google Drive)
from google.colab import files
import zipfile

# Option 1: Upload dataset as ZIP
uploaded = files.upload()
!unzip dataset.zip

# Option 2: Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# Upload training script
uploaded = files.upload()  # Upload train_uzbek_food_model.py

# Run training
!python train_uzbek_food_model.py --dataset ./dataset --epochs 50

# Download model
files.download('model.tflite')
files.download('labels.txt')
```

---

## Alternative: Teachable Machine (No Code)

If you prefer a no-code solution:

1. Go to https://teachablemachine.withgoogle.com/train/image
2. Create "Image Project"
3. Add classes (plov, samsa, etc.)
4. Upload 20+ images per class
5. Click "Train Model"
6. Export as "TensorFlow Lite"
7. Download `model.tflite` and `labels.txt`
8. Integrate into mobile app

**Pros**: No coding, easy interface  
**Cons**: Less control, can't customize architecture

---

## Dataset Resources

### 🆓 FREE Image Collection (NEW!)

**Automated Download with FREE APIs**:

```bash
# Get free API keys from Unsplash and Pexels
# See FREE_DATASETS_GUIDE.md for setup instructions

# Download 25 images per food for top 10 foods
python download_food_images.py --tier1 --count 25
```

**Generate Labels from Your Database**:

```bash
# Your app already has 350+ foods with nutrition info!
# Generate TFLite labels automatically:
python generate_labels_from_database.py
```

See **[FREE_DATASETS_GUIDE.md](./FREE_DATASETS_GUIDE.md)** for:

- Free image APIs (Unsplash, Pexels)
- Public datasets (Food-101, UECFOOD-256)
- Manual collection tips
- Complete workflow from database to trained AI

### Existing Food Datasets

- **Food-101**: 101 food classes, 1000 images each (free for research)
- **UECFOOD-256**: 256 Japanese food classes (31k images)
- **VireoFood-172**: Chinese food dataset (110k images)

### Creating Your Own

**Recommended workflow**:

1. Week 1: Run automated download for Tier 1 (10 foods × 25 images)
2. Week 2: Train initial model, test accuracy
3. Week 3: Collect your own photos for Uzbek foods
4. Week 4: Add Tier 2 foods, retrain
5. Repeat until complete (target: 30 foods)

---

## Troubleshooting

### "Not enough images" error

- Need minimum 20 images per food
- Use `collect_images.py --analyze-only` to check

### Low accuracy (<70%)

- Add more images (50+ per food)
- Train longer (100 epochs)
- Fine-tune more layers (--trainable-layers 40)
- Check if images are too similar

### Model too large (>50MB)

- Enable quantization (default: enabled)
- Use fewer trainable layers (--trainable-layers 10)

### TFLite conversion fails

- Update TensorFlow: `pip install -U tensorflow`
- Try without quantization
- Check model architecture compatibility

---

## Advanced Configuration

### Resume Training

```python
from tensorflow.keras.models import load_model

# Load previous model
model = load_model('best_model.h5')

# Continue training
model.fit(train_gen, epochs=50, initial_epoch=50)
```

### Custom Architecture

Edit `create_model()` function in `train_uzbek_food_model.py`:

- Change base model (MobileNetV3, EfficientNet)
- Adjust classifier layers
- Modify dropout rates

### Data Augmentation

Edit `create_data_generators()` function:

- Adjust rotation range
- Add color jittering
- Change zoom range

---

## Next Steps

After successful training:

1. **Test Model**: Try on new images not in training set
2. **Check Metrics**: Review `training_history.png`
3. **Iterate**: Add more images to improve accuracy
4. **Deploy**: Integrate into mobile app
5. **Monitor**: Track real-world performance

For integration instructions, see `../TFLITE_SETUP.md`.

For detailed training guide, see `../TRAINING_GUIDE.md`.
