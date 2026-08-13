/**
 * Utilitas pemotongan (crop) secara proporsional dan kompresi gambar 
 * secara asinkron menggunakan HTML5 Canvas (Zero-Dependency).
 * Mengurangi gambar mentah 5MB menjadi ~150-300KB langsung di browser.
 */

export const processImage = async (
    file: File,
    targetRatio: number, // contoh: 4/5 (0.8) untuk Headshot, 3/4 (0.75) untuk Side/Full
    maxDimension: number = 1080,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return reject(new Error('Berkas harus berupa gambar'));
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Kalkulasi rasio asli dan area crop agar proporsional secara sentrik
                const originalRatio = img.width / img.height;
                let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;

                if (originalRatio > targetRatio) {
                    // Gambar terlalu lebar, potong sisi kiri dan kanan
                    cropW = img.height * targetRatio;
                    cropX = (img.width - cropW) / 2;
                } else if (originalRatio < targetRatio) {
                    // Gambar terlalu tinggi, potong dari sisi atas dan bawah
                    cropH = img.width / targetRatio;
                    cropY = (img.height - cropH) / 2;
                }

                // Kalkulasi batas resolusi tertinggi (Max 1080p)
                let finalW = cropW;
                let finalH = cropH;

                if (finalW > maxDimension || finalH > maxDimension) {
                    if (finalW > finalH) {
                        finalH = (maxDimension / finalW) * finalH;
                        finalW = maxDimension;
                    } else {
                        finalW = (maxDimension / finalH) * finalW;
                        finalH = maxDimension;
                    }
                }

                // Gambar ke Canvas
                const canvas = document.createElement('canvas');
                canvas.width = finalW;
                canvas.height = finalH;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Gagal merender kanvas browser'));
                }

                ctx.drawImage(
                    img,
                    cropX, cropY, cropW, cropH, // Titik potong gambar asli
                    0, 0, finalW, finalH        // Digambar ke kanvas target
                );

                // Re-encode (Kompresi ke JPEG dengan Kualitas tertarget)
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Gagal mengompresi gambar (toBlob error)'));
                    }
                    
                    // Melebur nama file unik dengan ekstensi kompresinya (.jpg)
                    const fileName = file.name.replace(/\.[^/.]+$/, "") + "-compressed.jpg";
                    const newFile = new File([blob], fileName, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });

                    resolve(newFile);
                }, 'image/jpeg', quality);
            };

            img.onerror = () => reject(new Error('Gagal memuat buffer gambar'));
            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Gagal membaca blob berkas Anda'));
        reader.readAsDataURL(file);
    });
};
