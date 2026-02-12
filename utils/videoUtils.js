import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const MIN_SIZE_BYTES = 900 * 1024 * 1024; // 900 MB
const MAX_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB
const MIN_VIDEO_COUNT = 1;

// Mock for Web environment to allow UI testing
const isWeb = Platform.OS === 'web';

export function formatFileSize(bytes) {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
        return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
}

export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function validateVideoCount(count) {
    if (count < MIN_VIDEO_COUNT) {
        return {
            valid: false,
            error: `Please select at least ${MIN_VIDEO_COUNT} videos. You selected ${count}.`,
        };
    }
    return { valid: true };
}

export function validateVideoSize(size, fileName) {
    if (size < MIN_SIZE_BYTES) {
        return {
            valid: false,
            error: `"${fileName}" is too small (${formatFileSize(size)}). Minimum size is 900 MB.`,
        };
    }
    if (size > MAX_SIZE_BYTES) {
        return {
            valid: false,
            error: `"${fileName}" is too large (${formatFileSize(size)}). Maximum size is 1 GB.`,
        };
    }
    return { valid: true };
}

export function getDocumentsDirectory() {
    return FileSystem.documentDirectory;
}

export function extractFileName(uri) {
    const parts = uri.split('/');
    return parts[parts.length - 1] || `video_${Date.now()}.mov`;
}

export async function pickVideos() {
    console.log('[VideoUtils] Requesting media library permissions...');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        console.log('[VideoUtils] Permission denied');
        throw new Error('Permission to access media library was denied');
    }

    console.log('[VideoUtils] Opening video picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
    });

    if (result.canceled) {
        console.log('[VideoUtils] User cancelled picker');
        return null;
    }

    console.log(`[VideoUtils] User selected ${result.assets.length} videos`);

    const videosWithSize = [];

    for (const asset of result.assets) {
        console.log(`[VideoUtils] Getting info for: ${asset.uri}`);

        let size = asset.fileSize || 0;
        const fileName = extractFileName(asset.uri);

        // Double check size with FileSystem if possible (iOS)
        if (!isWeb && (!size || size === 0)) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                if (fileInfo.exists) {
                    size = fileInfo.size;
                }
            } catch (e) {
                console.warn('[VideoUtils] Failed to get file info:', e);
            }
        }

        // MOCK for Web: Random large size if 0
        if (isWeb && size === 0) {
            size = 950 * 1024 * 1024; // 950MB
        }

        console.log(`[VideoUtils] ${fileName}: ${formatFileSize(size)}`);

        videosWithSize.push({
            uri: asset.uri,
            fileName,
            size,
        });
    }

    return videosWithSize;
}

export function validateVideoFormat(fileName) {
    if (!fileName.toLowerCase().endsWith('.mov')) {
        return {
            valid: false,
            error: `"${fileName}" is not a .mov file. Only HEVC (.mov) videos are allowed.`,
        };
    }
    return { valid: true };
}

export function validateVideos(videos) {
    const countValidation = validateVideoCount(videos.length);
    if (!countValidation.valid) {
        return countValidation;
    }

    for (const video of videos) {
        const formatValidation = validateVideoFormat(video.fileName);
        if (!formatValidation.valid) {
            return formatValidation;
        }

        const sizeValidation = validateVideoSize(video.size, video.fileName);
        if (!sizeValidation.valid) {
            return sizeValidation;
        }
    }

    return { valid: true };
}

export async function copyVideoToDocuments(video) {
    if (isWeb) {
        console.log('[VideoUtils] Web environment: Skipping native copy.');
        return {
            id: generateId(),
            fileName: video.fileName,
            size: video.size,
            localPath: video.uri, // Just use original URI on web
            createdAt: new Date().toISOString(),
        };
    }

    const documentsDir = getDocumentsDirectory();
    const uniqueFileName = `${generateId()}_${video.fileName}`;
    // FileSystem.documentDirectory usually ends with '/', but let's be safe
    const destinationUri = documentsDir + uniqueFileName;

    console.log(`[VideoUtils] Copying video to: ${destinationUri}`);
    console.log(`[VideoUtils] Source: ${video.uri}`);

    try {
        await FileSystem.copyAsync({
            from: video.uri,
            to: destinationUri
        });

        console.log(`[VideoUtils] Successfully copied: ${uniqueFileName}`);

        const copiedFileInfo = await FileSystem.getInfoAsync(destinationUri);
        if (!copiedFileInfo.exists) {
            throw new Error(`Failed to verify copied file: ${uniqueFileName}`);
        }

        return {
            id: generateId(),
            fileName: video.fileName,
            size: video.size, // Trust original size or get from copiedFileInfo
            localPath: destinationUri,
            createdAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[VideoUtils] Copy failed:', error);
        throw error;
    }
}

export async function processSelectedVideos(videos, onProgress) {
    console.log(`[VideoUtils] Processing ${videos.length} videos...`);

    const metadata = [];

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (onProgress) {
            onProgress(i + 1, videos.length);
        }

        console.log(`[VideoUtils] Processing ${i + 1}/${videos.length}: ${video.fileName}`);

        const videoMetadata = await copyVideoToDocuments(video);
        metadata.push(videoMetadata);
    }

    console.log(`[VideoUtils] Successfully processed ${metadata.length} videos`);
    return metadata;
}
