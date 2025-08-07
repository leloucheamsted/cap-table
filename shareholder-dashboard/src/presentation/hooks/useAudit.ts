import { useState, useEffect, useCallback } from 'react';
import { AuditEvent, AuditEventFilter, AuditStats } from '../../core/types/AuditEvent';
import {
    GetAuditEventsUseCase,
    GetRecentAuditEventsUseCase,
} from '../../domain/usecases/audit_usecase/audit_usecase';
import { AuditRepositoryApi } from '../../infrastructure/persistance/AuditRepositoryApi';
import { AuditEndpoint } from '../../infrastructure/api/endpoints/audit_endpoint';
import { GetAuditStatsUseCase } from '../../domain/usecases/audit_usecase/GetAuditStatsUsecase';

const auditEndpoint = new AuditEndpoint();
const auditRepository = new AuditRepositoryApi(auditEndpoint);
const getAuditStatsUseCase = new GetAuditStatsUseCase(auditRepository);
const getAuditEventsUseCase = new GetAuditEventsUseCase(auditRepository);
const getRecentAuditEventsUseCase = new GetRecentAuditEventsUseCase(auditRepository);

export function useAudit() {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);
    const showLogmessageTest = () => {
        console.log('This is a test log message from useAudit hook');

    }

    const loadAuditEvents = useCallback(
        async (filters?: AuditEventFilter) => {
            try {
                setLoading(true);
                setError(null);

                const auditEvents = await getAuditEventsUseCase.execute(filters || {});
                setEvents(auditEvents);

                return auditEvents;
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to load audit events';
                setError(errorMessage);
                console.error('[useAudit] Error loading audit events:', err);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setError, setEvents]
    );


    const loadRecentAuditEvents = useCallback(
        async (limit: number = 10) => {
            try {
                setError(null);

                const recent = await getRecentAuditEventsUseCase.execute(limit);
                setRecentEvents(recent);

                return recent;
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to load recent audit events';
                setError(errorMessage);
                console.error('[useAudit] Error loading recent events:', err);
                throw new Error(errorMessage);
            }
        },
        [setError, setRecentEvents]
    );


    const loadAuditStats = useCallback(
        async () => {
            try {
                setError(null);

                const auditStats = await getAuditStatsUseCase.execute();
                setStats(auditStats);

                return auditStats;
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to load audit statistics';
                setError(errorMessage);
                console.error('[useAudit] Error loading audit stats:', err);
                throw new Error(errorMessage);
            }
        },
        [setError, setStats]
    );


    const refreshAuditData = useCallback(
        async () => {
            console.log('[useAudit] refreshAuditData called');
            try {
                setLoading(true);
                setError(null);

                const [statsResult, recentResult] = await Promise.allSettled([
                    loadAuditStats(),
                    loadRecentAuditEvents()
                ]);

                console.log('[useAudit] Results:', { statsResult, recentResult });

                const errors: string[] = [];
                if (statsResult.status === 'rejected') {
                    console.error('[useAudit] Stats failed:', statsResult.reason);
                    errors.push(`Stats: ${statsResult.reason.message}`);
                }
                if (recentResult.status === 'rejected') {
                    console.error('[useAudit] Recent events failed:', recentResult.reason);
                    errors.push(`Recent: ${recentResult.reason.message}`);
                }

                if (errors.length > 0) {
                    setError(errors.join(', '));
                }
            } catch (err: any) {
                console.error('[useAudit] Unexpected error:', err);
                setError('Unexpected error during refresh');
            } finally {
                console.log('[useAudit] Done loading');
                setLoading(false);
            }
        },
        [setLoading, setError, loadAuditStats, loadRecentAuditEvents]
    );

    /**
     * Filter events by event type
     * @param eventType - Type of event to filter by
     */
    const filterEventsByType = useCallback(
        async (eventType: string) => {
            return loadAuditEvents({ event_type: eventType });
        },
        [loadAuditEvents]
    );

    /**
     * Filter events by date range
     * @param startDate - Start date (ISO string)
     * @param endDate - End date (ISO string)
     */
    const filterEventsByDateRange = useCallback(
        async (startDate: string, endDate: string) => {
            return loadAuditEvents({ start_date: startDate, end_date: endDate });
        },
        [loadAuditEvents]
    );

    /**
     * Filter events by user
     * @param userId - User ID to filter by
     */
    const filterEventsByUser = useCallback(
        async (userId: number) => {
            return loadAuditEvents({ user_id: userId });
        },
        [loadAuditEvents]
    );

    /**
     * Get events for a specific page
     * @param page - Page number (0-based)
     * @param pageSize - Number of events per page
     * @param filters - Additional filters
     */
    const loadEventsPage = useCallback(
        async (page: number, pageSize: number = 20, filters?: AuditEventFilter) => {
            const offset = page * pageSize;
            const paginatedFilters = {
                ...filters,
                limit: pageSize,
                offset
            };

            return loadAuditEvents(paginatedFilters);
        },
        [loadAuditEvents]
    );

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Clear all audit data
     */
    const clearAuditData = useCallback(() => {
        setEvents([]);
        setRecentEvents([]);
        setStats(null);
        setError(null);
        setHasLoaded(false);
    }, []);

    /**
     * Get event type statistics from current stats
     */
    const getEventTypeStats = useCallback(
        () => {
            if (!stats?.today_events) return [];

            return Object.entries(stats.today_events).map(([type, count]) => ({
                event_type: type,
                count: count as number,
                percentage: stats.total_events > 0 ? ((count as number) / stats.total_events * 100) : 0
            }));
        },
        [stats]
    );

    const [statsData, setStatsData] = useState<{
        totalEvents: number;
        activeUsersToday: number;
        todayEventsCount: number;
        eventTypeStats: Array<{
            event_type: string;
            count: number;
            percentage: number;
        }>;
    }>({
        totalEvents: 0,
        activeUsersToday: 0,
        todayEventsCount: 0,
        eventTypeStats: []
    });

    // ✅ Calculate derived stats when raw stats change
    // useEffect(() => {
    //     if (stats) {
    //         const todayEventsSum = stats.today_events ?
    //             Object.values(stats.today_events).reduce((sum, count) => sum + (count as number), 0) : 0;

    //         const eventTypeStats = stats.today_events ?
    //             Object.entries(stats.today_events).map(([type, count]) => ({
    //                 event_type: type,
    //                 count: count as number,
    //                 percentage: stats.total_events > 0 ? ((count as number) / stats.total_events * 100) : 0
    //             })) : [];

    //         setStatsData({
    //             totalEvents: stats.total_events || 0,
    //             activeUsersToday: stats.active_users_today || 0,
    //             todayEventsCount: todayEventsSum,
    //             eventTypeStats
    //         });
    //     }
    // }, [stats]);

    /**
     * Auto-load audit data on first mount
     */
    useEffect(() => {
        if (!hasLoaded) {
            console.log('[useAudit] Auto-loading audit data...');
            refreshAuditData().finally(() => {
                setHasLoaded(true);
            });
        }
    }, [hasLoaded, refreshAuditData, setHasLoaded]);



    return {
        // État
        events,
        recentEvents,
        stats,
        loading,
        error,
        isExporting,

        loadAuditEvents,
        loadRecentAuditEvents,
        loadAuditStats,
        refreshAuditData,

        filterEventsByType,
        filterEventsByDateRange,
        filterEventsByUser,
        loadEventsPage,

        clearError,
        clearAuditData,
        getEventTypeStats,
        showLogmessageTest,
        hasEvents: events.length > 0,
        hasRecentEvents: recentEvents.length > 0,
        hasStats: stats !== null,
        isEmpty: events.length === 0 && !loading,

        totalEvents: statsData.totalEvents,
        todayEventsCount: statsData.todayEventsCount,
        activeUsersToday: statsData.activeUsersToday,
        statsData,
    };
};