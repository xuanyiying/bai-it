import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import {
    SubscriptionService,
    SubscriptionProduct,
    SUBSCRIPTION_PRODUCTS,
    Subscription,
    SubscriptionPlan,
} from '../services/subscription';

type SubscriptionScreenProps = {
    navigation: any;
};

export function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
    const { theme } = useTheme();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        const sub = await SubscriptionService.getSubscription();
        setSubscription(sub);
        if (sub?.plan) {
            setSelectedPlan(sub.plan);
        }
    };

    const handlePurchase = async (plan: SubscriptionPlan) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsLoading(true);

        const result = await SubscriptionService.purchaseSubscription(plan);

        setIsLoading(false);

        if (result.success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('购买成功', '感谢您的订阅！', [
                { text: '确定', onPress: loadSubscription },
            ]);
        } else {
            Alert.alert('购买失败', result.error || '请重试');
        }
    };

    const handleRestore = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRestoring(true);

        const success = await SubscriptionService.restorePurchases();

        setIsRestoring(false);

        if (success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('恢复成功', '您的订阅已恢复', [
                { text: '确定', onPress: loadSubscription },
            ]);
        } else {
            Alert.alert('恢复失败', '未找到有效的购买记录');
        }
    };

    const handleCancel = async () => {
        Alert.alert(
            '取消订阅',
            '取消后将在当前订阅期结束后停止服务，确定要取消吗？',
            [
                { text: '保留订阅', style: 'cancel' },
                {
                    text: '确认取消',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await SubscriptionService.cancelSubscription();
                        if (success) {
                            Alert.alert('已取消', '自动续费已关闭');
                            loadSubscription();
                        }
                    },
                },
            ]
        );
    };

    const renderCurrentSubscription = () => {
        if (!subscription || subscription.status !== 'active') return null;

        const product = SUBSCRIPTION_PRODUCTS.find(p => p.plan === subscription.plan);

        return (
            <View style={[styles.currentSubCard, { backgroundColor: theme.colors.primary + '15' }]}>
                <View style={styles.currentSubHeader}>
                    <Ionicons name="diamond" size={28} color={theme.colors.primary} />
                    <View style={styles.currentSubInfo}>
                        <Text style={[styles.currentSubTitle, { color: theme.colors.text }]}>
                            {product?.title || '会员订阅'}
                        </Text>
                        <Text style={[styles.currentSubStatus, { color: theme.colors.success }]}>
                            生效中
                        </Text>
                    </View>
                </View>
                <View style={[styles.currentSubDivider, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.currentSubDetail, { color: theme.colors.textSecondary }]}>
                    {subscription.plan === 'lifetime'
                        ? '永久有效'
                        : `有效期至 ${SubscriptionService.formatExpiryDate(subscription.expiryDate)}`}
                </Text>
                {subscription.autoRenew && subscription.plan !== 'lifetime' && (
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.error }]}
                        onPress={handleCancel}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.error }]}>
                            关闭自动续费
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderProductCard = (product: SubscriptionProduct) => {
        const isSelected = selectedPlan === product.plan;
        const isCurrentPlan = subscription?.plan === product.plan && subscription?.status === 'active';

        return (
            <TouchableOpacity
                key={product.id}
                style={[
                    styles.productCard,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                    },
                ]}
                onPress={() => setSelectedPlan(product.plan)}
                disabled={isCurrentPlan}
            >
                {product.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.popularText}>最受欢迎</Text>
                    </View>
                )}

                {isCurrentPlan && (
                    <View style={[styles.currentBadge, { backgroundColor: theme.colors.success }]}>
                        <Text style={styles.currentText}>当前方案</Text>
                    </View>
                )}

                <View style={styles.productHeader}>
                    <Text style={[styles.productTitle, { color: theme.colors.text }]}>
                        {product.title}
                    </Text>
                    <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                        ¥{product.price}
                    </Text>
                </View>

                <Text style={[styles.productPeriod, { color: theme.colors.textSecondary }]}>
                    /{product.period}
                </Text>

                <View style={[styles.productDivider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.featuresList}>
                    {product.features.map((feature, index) => (
                        <View key={`feature-${index}`} style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                            <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                {feature}
                            </Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    const hasActiveSubscription = subscription?.status === 'active';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>订阅会员</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderCurrentSubscription()}

                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    {hasActiveSubscription ? '升级方案' : '选择方案'}
                </Text>

                <View style={styles.productsContainer}>
                    {SUBSCRIPTION_PRODUCTS.map(renderProductCard)}
                </View>

                {!hasActiveSubscription && (
                    <TouchableOpacity
                        style={[styles.purchaseButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handlePurchase(selectedPlan)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.purchaseButtonText}>
                                立即订阅
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    disabled={isRestoring}
                >
                    {isRestoring ? (
                        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    ) : (
                        <Text style={[styles.restoreText, { color: theme.colors.textSecondary }]}>
                            恢复购买
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.termsContainer}>
                    <Text style={[styles.termsText, { color: theme.colors.textTertiary }]}>
                        订阅将自动续费，您可以在设置中随时取消。
                        付款将在确认购买时从您的账户中扣除。
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 16,
    },
    currentSubCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    currentSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentSubInfo: {
        marginLeft: 12,
    },
    currentSubTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    currentSubStatus: {
        fontSize: 13,
        marginTop: 2,
    },
    currentSubDivider: {
        height: 1,
        marginVertical: 16,
    },
    currentSubDetail: {
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 16,
        marginLeft: 4,
    },
    productsContainer: {
        gap: 12,
    },
    productCard: {
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
    },
    popularText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    currentBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
    },
    currentText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    productPrice: {
        fontSize: 28,
        fontWeight: '700',
    },
    productPeriod: {
        fontSize: 14,
        marginTop: 4,
    },
    productDivider: {
        height: 1,
        marginVertical: 16,
    },
    featuresList: {
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 14,
    },
    purchaseButton: {
        marginTop: 24,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    restoreButton: {
        marginTop: 16,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restoreText: {
        fontSize: 14,
    },
    termsContainer: {
        marginTop: 24,
        paddingHorizontal: 8,
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});
