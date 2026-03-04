"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';

export type MapMarker = {
    id: string;
    type: string;
    lat: number;
    lng: number;
    created_by: string;
    created_at?: string;
};

export type PresentUser = {
    userId: string;
    name: string;
    cursor?: { x: number; y: number };
};

export function useWarRoomChannel(initialMarkers: MapMarker[] = []) {
    const { data: session } = useSession();
    const [activeUsers, setActiveUsers] = useState<PresentUser[]>([]);
    const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        // We only connect if we have a valid session to broadcast presence
        if (!session?.user) return;

        // Create a unique channel for the map
        const room = supabase.channel('war_room', {
            config: {
                presence: {
                    key: session.user.id,
                },
            },
        });

        // Handle Presence state changes
        room
            .on('presence', { event: 'sync' }, () => {
                const state = room.presenceState();
                const users: PresentUser[] = [];

                for (const id in state) {
                    // state[id] is an array of presence objects for that key
                    const presenceObj = state[id][0] as any;
                    if (presenceObj) {
                        users.push({
                            userId: presenceObj.userId,
                            name: presenceObj.name,
                            cursor: presenceObj.cursor,
                        });
                    }
                }
                setActiveUsers(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Optional: toast notification that someone joined
                console.log('Joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Left:', key, leftPresences);
            })

            // Handle custom Broadcast events for Map Markers
            .on('broadcast', { event: 'new_marker' }, ({ payload }) => {
                setMarkers((current) => [...current, payload as MapMarker]);
            })
            .on('broadcast', { event: 'delete_marker' }, ({ payload }) => {
                setMarkers((current) => current.filter(m => m.id !== payload.id));
            })

            // Handle Cursor movement broadcasts (throttled)
            .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
                setActiveUsers((current) =>
                    current.map(user =>
                        user.userId === payload.userId
                            ? { ...user, cursor: payload.cursor }
                            : user
                    )
                );
            });

        // Subscribe to the channel
        room.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Once subscribed, track this user's presence
                await room.track({
                    userId: session.user.id,
                    name: session.user.name || 'Operative',
                    online_at: new Date().toISOString(),
                });
            }
        });

        setChannel(room);

        // Cleanup: untrack and remove channel on unmount
        return () => {
            room.untrack();
            supabase.removeChannel(room);
        };
    }, [session]);

    const broadcastNewMarker = async (marker: MapMarker) => {
        if (channel) {
            await channel.send({
                type: 'broadcast',
                event: 'new_marker',
                payload: marker,
            });
            // Optimistically update local state as well
            setMarkers((current) => [...current, marker]);
        }
    };

    const broadcastDeleteMarker = async (id: string) => {
        if (channel) {
            await channel.send({
                type: 'broadcast',
                event: 'delete_marker',
                payload: { id },
            });
            setMarkers((current) => current.filter(m => m.id !== id));
        }
    };

    const broadcastCursorMove = async (x: number, y: number) => {
        if (channel && session?.user?.id) {
            await channel.send({
                type: 'broadcast',
                event: 'cursor_move',
                payload: { userId: session.user.id, cursor: { x, y } }
            });
        }
    };

    return {
        activeUsers,
        markers,
        broadcastNewMarker,
        broadcastDeleteMarker,
        broadcastCursorMove
    };
}
