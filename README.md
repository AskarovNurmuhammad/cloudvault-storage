# 📁 CloudVault - Full-Stack Cloud Storage Platform

Zamonaviy **Google Drive / Dropbox** muqobili bo'lgan to'liq **Full-Stack** bulutli fayl boshqaruvi platformasi.

## 🚀 Texnologiyalar
- **Backend:** Python 3.12, FastAPI, Uvicorn, Python-Multipart
- **Frontend:** React 19, TypeScript (TSX), Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti

## ✨ Asosiy Imkoniyatlar
1. **Fayl & Papkalar Boshqaruvi:** Fayllarni sudrab tashlash (Drag & Drop), papkalarga saralash, qidiruv.
2. **REST API:**
   - `POST /api/upload` - Fayllarni diskka yuklash
   - `GET /api/files` - Filtrlangan fayllar ro'yxati
   - `GET /api/files/{id}/download` - Faylni kompyuterga yuklab olish
   - `DELETE /api/files/{id}` - Faylni butunlay o'chirish
   - `PATCH /api/files/{id}/star` - Sevimlilarga qo'shish/olib tashlash
   - `GET /api/storage/stats` - Xotira kvotasi analitikasi (15 GB)
3. **Jonli Status:** Frontendda Python backendning real vaqtda ishlab turganligi indikatori (`🟢 Onlayn / 🔴 Oflayn`).
4. **Dark / Light Mode:** Notion va Linear uslubidagi yuqori kontrastli toza yorug' va qorong'i rejimlar.

## 🏃‍♂️ Ishga tushirish (Oddiy 1-bosqich)
Loyiha papkasidagi `run_fullstack.bat` faylini ikki marta bosing!
U avtomatik ravishda FastAPI backend va React frontendni yoqib, brauzerni ochadi.

Yoki qo'lda:
```bash
# 1. Backend:
cd backend
python -m uvicorn main:app --reload --port 8000

# 2. Frontend:
cd frontend
npm run dev
```
