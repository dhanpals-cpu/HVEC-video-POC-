import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, CheckCircle, AlertCircle, Film, FolderOpen, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoStore } from '../store/videoStore';
import {
    pickVideos,
    validateVideos,
    processSelectedVideos,
    formatFileSize,
} from '../utils/videoUtils';
import { colors } from '../constants/colors';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { videos, isLoading, error, loadVideos, addVideos, setError, clearError, setLoading } = useVideoStore();

    const [progress, setProgress] = useState(null);
    const [processingStatus, setProcessingStatus] = useState('');

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    const handleSelectVideos = useCallback(async () => {
        clearError();
        setLoading(true);
        setProgress(null);
        setProcessingStatus('');

        try {
            setProcessingStatus('Opening gallery...');
            const selectedVideos = await pickVideos();

            if (!selectedVideos) {
                setLoading(false);
                setProcessingStatus('');
                return;
            }

            setProcessingStatus('Validating videos...');
            const validation = validateVideos(selectedVideos);

            if (!validation.valid) {
                setError(validation.error || 'Validation failed');
                setLoading(false);
                setProcessingStatus('');
                return;
            }

            setProcessingStatus('Copying videos to app storage...');
            const metadata = await processSelectedVideos(
                selectedVideos,
                (current, total) => {
                    setProgress({ current, total });
                    setProcessingStatus(`Copying video ${current} of ${total}...`);
                }
            );

            setProcessingStatus('Saving metadata...');
            await addVideos(metadata);

            setProgress(null);
            setProcessingStatus('');
            console.log('[HomeScreen] Successfully added videos');
        } catch (err) {
            console.error('[HomeScreen] Error:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setLoading(false);
            setProgress(null);
            setProcessingStatus('');
        }
    }, [addVideos, clearError, setError, setLoading]);

    const router = useRouter();

    const renderVideoItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.videoItem}
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/player",
                params: {
                    uri: encodeURIComponent(item.localPath),
                    fileName: item.fileName
                }
            })}
        >
            <View style={styles.iconContainer}>
                <Film size={24} color={colors.primary} />
            </View>
            <View style={styles.videoInfo}>
                <Text style={styles.videoName} numberOfLines={1}>
                    {item.fileName}
                </Text>
                <View style={styles.videoMeta}>
                    <Text style={styles.metaText}>{formatFileSize(item.size)}</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.metaText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <View style={styles.checkIcon}>
                <CheckCircle size={18} color={colors.success} />
            </View>
        </TouchableOpacity>
    ), [router]);

    const renderEmptyState = useCallback(() => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <FolderOpen size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Videos Yet</Text>
            <Text style={styles.emptySubtitle}>
                Select at least 5 HEVC videos{'\n'}(900MB - 1GB each) to get started
            </Text>
        </View>
    ), []);

    const renderHeader = useCallback(() => (
        <View style={styles.statsContainer}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{videos.length}</Text>
                <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {formatFileSize(videos.reduce((sum, v) => sum + v.size, 0))}
                </Text>
                <Text style={styles.statLabel}>Total Size</Text>
            </View>
        </View>
    ), [videos]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={[colors.surface, colors.background]}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Video size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.headerTitle}>HEVC Video Manager</Text>
                    <Text style={styles.headerSubtitle}>iOS Large Video Storage POC</Text>
                </View>
            </LinearGradient>

            {error && (
                <View style={styles.errorContainer}>
                    <AlertCircle size={20} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={clearError} style={styles.closeButton}>
                        <X size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            )}

            {videos.length > 0 && renderHeader()}

            <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                renderItem={renderVideoItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                style={videos.length === 0 ? styles.emptyList : undefined}
            />

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>
                            {processingStatus || 'Processing...'}
                        </Text>
                        {progress && (
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(progress.current / progress.total) * 100}%` }
                                    ]}
                                />
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSelectVideos}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isLoading ? [colors.surfaceLight, colors.surface] : [colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        <Video size={22} color={isLoading ? colors.textMuted : 'white'} />
                        <Text style={[styles.buttonText, isLoading && styles.buttonTextDisabled]}>
                            {isLoading ? 'Processing...' : 'Select Video'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Select 5+ HEVC videos • 900MB - 1GB each
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6', // gray-100
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: 20,
    },
    headerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f9fafb', // gray-50
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280', // gray-500
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2', // red-50
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca', // red-200
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#ef4444', // red-500
        marginLeft: 10,
    },
    closeButton: {
        padding: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280', // gray-500
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e5e7eb', // gray-200
    },
    listContent: {
        padding: 16,
    },
    emptyList: {
        flex: 1,
    },
    videoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f9fafb', // gray-50
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoInfo: {
        flex: 1,
        marginLeft: 14,
    },
    videoName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'black',
        marginBottom: 4,
    },
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280', // gray-500
    },
    dotSeparator: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#9ca3af', // gray-400
        marginHorizontal: 8,
    },
    checkIcon: {
        marginLeft: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280', // gray-500
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 16,
        backgroundColor: '#f3f4f6', // gray-100
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb', // gray-200
        paddingTop: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 13,
        color: '#6b7280', // gray-500
        marginTop: 8,
    },
    progressBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#e5e7eb', // gray-200
        borderRadius: 2,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6', // blue-500
        borderRadius: 2,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        color: 'white',
    },
    buttonTextDisabled: {
        color: '#9ca3af', // gray-400
    },
    footerNote: {
        fontSize: 12,
        color: '#9ca3af', // gray-400
        textAlign: 'center',
        marginTop: 12,
    },
});
