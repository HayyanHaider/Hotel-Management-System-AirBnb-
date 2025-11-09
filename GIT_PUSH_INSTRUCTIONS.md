# Git Push Instructions

Follow these steps to push your project to GitHub:

## 1. Initialize Git (if not already done)
```bash
git init
```

## 2. Add Remote Repository (if you have one)
```bash
git remote add origin <your-github-repo-url>
```

## 3. Add All Files
```bash
git add .
```

## 4. Commit Changes
```bash
git commit -m "Complete Hotel Management System with room-based booking, automatic coupons, and earnings tracking"
```

## 5. Push to GitHub
```bash
git push -u origin main
```

## If you get an error about branch name:
```bash
git branch -M main
git push -u origin main
```

## If you need to create a new repository on GitHub:
1. Go to https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL
4. Use it in step 2 above

