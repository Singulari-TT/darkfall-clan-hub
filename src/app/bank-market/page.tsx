"use client";

import { useEffect, useState } from "react";
import { MarketOrder, fetchMarketOrders, createMarketOrder, deleteMarketOrder, updateOrderStatus, sendOrderToDiscord } from "./actions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Tag, User, Clock, CheckCircle, XCircle, Send, Plus, Trash2 } from "lucide-react";

export default function MarketplacePage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<MarketOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrderType, setNewOrderType] = useState<'Buy' | 'Sell'>('Buy');
    const [newItemName, setNewItemName] = useState('');
    const [newQuantity, setNewQuantity] = useState(1);
    const [newPrice, setNewPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await fetchMarketOrders();
            setOrders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadOrders();
        }
    }, [status]);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createMarketOrder(newOrderType, newItemName, newQuantity, newPrice);
            setIsModalOpen(false);
            setNewItemName('');
            setNewQuantity(1);
            setNewPrice('');
            await loadOrders();
        } catch (error) {
            console.error(error);
            alert("Failed to submit market order.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to pull this order from the market?")) return;
        try {
            await deleteMarketOrder(id);
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (e) {
            alert("Failed to delete order (unauthorized).");
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'Open' | 'Fulfilled' | 'Cancelled') => {
        try {
            await updateOrderStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        } catch (e) {
            alert("Failed to update status (unauthorized).");
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-[#5865F2] animate-spin"></div>
                <p className="text-[#5865F2] font-mono text-xs tracking-widest uppercase animate-pulse">Accessing Logistics...</p>
            </div>
        );
    }

    const buyOrders = orders.filter(o => o.order_type === 'Buy' && o.status === 'Open');
    const sellOrders = orders.filter(o => o.order_type === 'Sell' && o.status === 'Open');
    const myOrders = orders.filter(o => o.Users?.discord_id === session?.user?.id);

    return (
        <div className="min-h-screen bg-transparent text-gray-200 p-4 sm:p-8 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-[1500px] mx-auto space-y-8 relative z-10">

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-social-cobalt-border group"
                            title="Back to Command"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-social-cobalt" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4 mb-2 leading-tight">
                                <span className="text-[#5865F2]">Marketplace</span>
                            </h1>
                            <p className="text-gray-400 font-sans text-sm">Trade logistics, secure resources, and coordinate supply chains.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-bold py-3 px-8 rounded-xl shadow-[0_4px_20px_rgba(88,101,242,0.3)] transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 border border-[#5865F2] tracking-widest uppercase text-sm"
                    >
                        <span className="text-xl leading-none">+</span> Post Order
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Buy Orders Column */}
                    <div className="border border-white/10 rounded-2xl p-6 bg-black/20 backdrop-blur-xl min-h-[500px] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <h2 className="text-lg font-bold tracking-widest uppercase text-emerald-400">Bank Wants to Buy</h2>
                            </div>
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-md text-[10px] tracking-widest shadow-inner border border-emerald-500/30 uppercase">
                                {buyOrders.length} Active
                            </span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {buyOrders.length === 0 ? (
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-black/10">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No active buy orders</span>
                                </div>
                            ) : (
                                buyOrders.map(order => (
                                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col hover:border-emerald-500/50 transition-colors shadow-lg relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <h3 className="text-lg font-black text-white leading-tight tracking-wide">{order.item_name}</h3>
                                            <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 shadow-inner">{order.price}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/10 relative z-10">
                                            <div className="text-xs text-gray-500 font-mono w-full flex-col flex gap-2">
                                                <span className="tracking-tighter">Qty: <span className="text-gray-200">{order.quantity}</span> | By: <span className="text-gray-400">{order.Users?.display_name || 'Banker'}</span></span>
                                                {session?.user && (session.user as any).role !== 'Admin' && order.status === 'Open' && (
                                                    <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="w-full mt-2 bg-white/5 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-lg transition-colors text-[10px] font-bold border border-white/10 hover:border-emerald-500/50 uppercase tracking-widest">
                                                        Sell to Bank
                                                    </button>
                                                )}
                                                {session?.user && (session.user as any).role === 'Admin' && order.status === 'Open' && (
                                                    <div className="flex gap-2 w-full mt-2">
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white py-2 rounded-lg transition-colors text-[10px] font-bold border border-emerald-500/30 uppercase tracking-widest">Fulfilled</button>
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-2 rounded-lg transition-colors text-[10px] font-bold border border-white/10 uppercase tracking-widest">Cancel</button>
                                                        <button
                                                            onClick={async () => {
                                                                const res = await sendOrderToDiscord(order.id);
                                                                if (res?.error) alert(res.error);
                                                                else alert("Order pinged to Discord successfully!");
                                                            }}
                                                            className="flex-none bg-[#5865F2]/10 hover:bg-[#5865F2] text-[#5865F2] hover:text-white px-3 py-2 rounded-lg transition-colors border border-[#5865F2]/30" title="Send to Discord">
                                                            <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.69 56.6 5.49 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.68 2a67.88 67.88 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c7.64-25.24 1.18-49.03-14.87-72.15zM42.45 65.69c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38zm42.24 0c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38z" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sell Orders Column */}
                    <div className="border border-white/10 rounded-2xl p-6 bg-black/20 backdrop-blur-xl min-h-[500px] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h2 className="text-lg font-bold tracking-widest uppercase text-rose-400">Bank is Selling</h2>
                            </div>
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-md text-[10px] tracking-widest shadow-inner border border-rose-500/30 uppercase">
                                {sellOrders.length} Active
                            </span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {sellOrders.length === 0 ? (
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-black/10">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No active sell orders</span>
                                </div>
                            ) : (
                                sellOrders.map(order => (
                                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col hover:border-rose-500/50 transition-colors shadow-lg relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <h3 className="text-lg font-black text-white leading-tight tracking-wide">{order.item_name}</h3>
                                            <span className="text-rose-400 font-mono font-bold text-sm bg-rose-500/10 px-3 py-1 rounded-md border border-rose-500/20 shadow-inner">{order.price}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/10 relative z-10">
                                            <div className="text-xs text-gray-500 font-mono w-full flex flex-col gap-2">
                                                <span className="tracking-tighter">Qty: <span className="text-gray-200">{order.quantity}</span> | By: <span className="text-gray-400">{order.Users?.display_name || 'Banker'}</span></span>
                                                {session?.user && (session.user as any).role !== 'Admin' && order.status === 'Open' && (
                                                    <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="w-full mt-2 bg-white/5 hover:bg-rose-500/20 text-rose-400 py-2 rounded-lg transition-colors text-[10px] font-bold border border-white/10 hover:border-rose-500/50 uppercase tracking-widest">
                                                        Buy from Bank
                                                    </button>
                                                )}
                                                {session?.user && (session.user as any).role === 'Admin' && order.status === 'Open' && (
                                                    <div className="flex gap-2 w-full mt-2">
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white py-2 rounded-lg transition-colors text-[10px] font-bold border border-rose-500/30 uppercase tracking-widest">Fulfilled</button>
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-2 rounded-lg transition-colors text-[10px] font-bold border border-white/10 uppercase tracking-widest">Cancel</button>
                                                        <button
                                                            onClick={async () => {
                                                                const res = await sendOrderToDiscord(order.id);
                                                                if (res?.error) alert(res.error);
                                                                else alert("Order pinged to Discord successfully!");
                                                            }}
                                                            className="flex-none bg-[#5865F2]/10 hover:bg-[#5865F2] text-[#5865F2] hover:text-white px-3 py-2 rounded-lg transition-colors border border-[#5865F2]/30" title="Send to Discord">
                                                            <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.69 56.6 5.49 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.68 2a67.88 67.88 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c7.64-25.24 1.18-49.03-14.87-72.15zM42.45 65.69c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38zm42.24 0c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38z" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                {/* My Orders Section */}
                <div className="mt-12 bg-black/20 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                    <h2 className="text-xl font-bold tracking-widest uppercase text-[#5865F2] mb-6 border-b border-white/10 pb-4">My Portfolio</h2>

                    {myOrders.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">You have no active or completed orders.</p>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-mono">
                                        <th className="pb-3 px-4">Type</th>
                                        <th className="pb-3 px-4">Item</th>
                                        <th className="pb-3 px-4">Qty</th>
                                        <th className="pb-3 px-4">Price</th>
                                        <th className="pb-3 px-4">Status</th>
                                        <th className="pb-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myOrders.map(order => (
                                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${order.order_type === 'Buy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'}`}>
                                                    {order.order_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-black text-gray-200">{order.item_name}</td>
                                            <td className="py-4 px-4 text-gray-400 font-mono">{order.quantity}</td>
                                            <td className="py-4 px-4 text-[#5865F2] font-mono font-bold text-sm tracking-tighter">{order.price}</td>
                                            <td className="py-4 px-4">
                                                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border ${order.status === 'Open' ? 'text-[#5865F2] border-[#5865F2]/30 bg-[#5865F2]/10' : order.status === 'Fulfilled' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-gray-500 border-gray-500/30 bg-gray-500/10'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    {order.status === 'Open' && (
                                                        <>
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm">Mark Fulfilled</button>
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="px-3 py-1.5 bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm">Cancel</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDelete(order.id)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors border border-transparent hover:border-rose-500/30 shadow-sm" title="Delete Form Record">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Post Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform transition-all">
                        <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                                <span className="text-[#5865F2]">⚖️</span> Post Market Order
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Order Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewOrderType('Buy')}
                                        className={`py-2 rounded-lg font-bold text-sm tracking-wide transition-all border ${newOrderType === 'Buy' ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}
                                    >Buy Order</button>
                                    <button
                                        type="button"
                                        onClick={() => setNewOrderType('Sell')}
                                        className={`py-2 rounded-lg font-bold text-sm tracking-wide transition-all border ${newOrderType === 'Sell' ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}
                                    >Sell Order</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    placeholder="e.g. Iron Ingot, Darkwood Bow"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-all text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newQuantity}
                                        onChange={e => setNewQuantity(parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-all text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Price (Total or Ea)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        placeholder="e.g. 50k Gold"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-all text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#5865F2]/90 hover:bg-[#5865F2] disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold uppercase tracking-widest py-3 px-6 rounded-lg shadow-[0_4px_20px_rgba(88,101,242,0.3)] transition-all text-sm border border-[#5865F2]"
                                >
                                    {isSubmitting ? 'Posting...' : 'Submit Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
