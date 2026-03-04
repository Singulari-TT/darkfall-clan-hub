"use client";

import { useEffect, useState } from "react";
import { MarketOrder, fetchMarketOrders, createMarketOrder, deleteMarketOrder, updateOrderStatus, sendOrderToDiscord } from "./actions";
import { useSession } from "next-auth/react";

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
        return <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div></div>;
    }

    const buyOrders = orders.filter(o => o.order_type === 'Buy' && o.status === 'Open');
    const sellOrders = orders.filter(o => o.order_type === 'Sell' && o.status === 'Open');
    const myOrders = orders.filter(o => o.Users?.discord_id === session?.user?.id);

    return (
        <div className="min-h-screen bg-[#0a0f18] text-gray-200 p-4 sm:p-8 font-sans selection:bg-amber-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 tracking-tight flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center border border-amber-500/30 shadow-inner shadow-amber-500/20 text-2xl">
                                ⚖️
                            </div>
                            Marketplace
                        </h1>
                        <p className="text-gray-400 font-medium text-lg">Trade logistics, secure resources, and coordinate supply chains.</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black py-3 px-8 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                    >
                        <span className="text-2xl leading-none">+</span> Post Order
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Buy Orders Column */}
                    <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-3xl p-6 backdrop-blur-sm min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-900/40">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <h2 className="text-xl font-black tracking-widest uppercase text-emerald-400">Bank Wants to Buy</h2>
                            </div>
                            <span className="text-emerald-300 font-bold bg-emerald-950/80 px-3 py-1 rounded-lg text-xs shadow-inner border border-emerald-900/50">
                                {buyOrders.length} Active
                            </span>
                        </div>
                        <div className="space-y-3 flex-1">
                            {buyOrders.length === 0 ? (
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-emerald-900/30 rounded-2xl bg-emerald-950/5">
                                    <span className="text-emerald-500/50 text-xs font-bold uppercase tracking-widest">No active buy orders</span>
                                </div>
                            ) : (
                                buyOrders.map(order => (
                                    <div key={order.id} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col hover:border-emerald-500/50 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-white leading-tight">{order.item_name}</h3>
                                            <span className="text-emerald-400 font-black text-lg bg-emerald-500/10 px-3 py-0.5 rounded-lg border border-emerald-500/20">{order.price}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-3 border-t border-gray-800/60">
                                            <div className="text-xs text-gray-500 font-medium w-full flex-col flex gap-2">
                                                <span>Qty: <span className="text-gray-300 font-bold">{order.quantity}</span> | By: <span className="text-gray-400">{order.Users?.display_name || 'Banker'}</span></span>
                                                {session?.user && (session.user as any).role !== 'Admin' && order.status === 'Open' && (
                                                    <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="w-full mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-1.5 rounded transition-colors text-xs font-bold border border-emerald-500/30">
                                                        Sell to Bank
                                                    </button>
                                                )}
                                                {session?.user && (session.user as any).role === 'Admin' && order.status === 'Open' && (
                                                    <div className="flex gap-2 w-full mt-1">
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-1.5 rounded transition-colors text-[10px] font-bold border border-emerald-500/30">Fulfilled</button>
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 py-1.5 rounded transition-colors text-[10px] font-bold border border-gray-700">Cancel</button>
                                                        <button
                                                            onClick={async () => {
                                                                const res = await sendOrderToDiscord(order.id);
                                                                if (res?.error) alert(res.error);
                                                                else alert("Order pinged to Discord successfully!");
                                                            }}
                                                            className="flex-none bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] px-3 py-1.5 rounded transition-colors text-[10px] font-bold border border-[#5865F2]/50" title="Send to Discord">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.69 56.6 5.49 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.68 2a67.88 67.88 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c7.64-25.24 1.18-49.03-14.87-72.15zM42.45 65.69c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38zm42.24 0c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38z" fill="#5865F2" /></svg>
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
                    <div className="bg-rose-950/10 border border-rose-900/30 rounded-3xl p-6 backdrop-blur-sm min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose-900/40">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h2 className="text-xl font-black tracking-widest uppercase text-rose-400">Bank is Selling</h2>
                            </div>
                            <span className="text-rose-300 font-bold bg-rose-950/80 px-3 py-1 rounded-lg text-xs shadow-inner border border-rose-900/50">
                                {sellOrders.length} Active
                            </span>
                        </div>
                        <div className="space-y-3 flex-1">
                            {sellOrders.length === 0 ? (
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-rose-900/30 rounded-2xl bg-rose-950/5">
                                    <span className="text-rose-500/50 text-xs font-bold uppercase tracking-widest">No active sell orders</span>
                                </div>
                            ) : (
                                sellOrders.map(order => (
                                    <div key={order.id} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col hover:border-rose-500/50 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-white leading-tight">{order.item_name}</h3>
                                            <span className="text-rose-400 font-black text-lg bg-rose-500/10 px-3 py-0.5 rounded-lg border border-rose-500/20">{order.price}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-3 border-t border-gray-800/60">
                                            <div className="text-xs text-gray-500 font-medium w-full flex flex-col gap-2">
                                                <span>Qty: <span className="text-gray-300 font-bold">{order.quantity}</span> | By: <span className="text-gray-400">{order.Users?.display_name || 'Banker'}</span></span>
                                                {session?.user && (session.user as any).role !== 'Admin' && order.status === 'Open' && (
                                                    <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="w-full mt-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded transition-colors text-xs font-bold border border-rose-500/30">
                                                        Buy from Bank
                                                    </button>
                                                )}
                                                {session?.user && (session.user as any).role === 'Admin' && order.status === 'Open' && (
                                                    <div className="flex gap-2 w-full mt-1">
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded transition-colors text-[10px] font-bold border border-rose-500/30">Fulfilled</button>
                                                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 py-1.5 rounded transition-colors text-[10px] font-bold border border-gray-700">Cancel</button>
                                                        <button
                                                            onClick={async () => {
                                                                const res = await sendOrderToDiscord(order.id);
                                                                if (res?.error) alert(res.error);
                                                                else alert("Order pinged to Discord successfully!");
                                                            }}
                                                            className="flex-none bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] px-3 py-1.5 rounded transition-colors text-[10px] font-bold border border-[#5865F2]/50" title="Send to Discord">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.69 56.6 5.49 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.68 2a67.88 67.88 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c7.64-25.24 1.18-49.03-14.87-72.15zM42.45 65.69c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38zm42.24 0c-6.11 0-11.16-5.56-11.16-12.38s4.96-12.38 11.16-12.38c6.25 0 11.23 5.56 11.16 12.38 0 6.82-5.01 12.38-11.16 12.38z" fill="#5865F2" /></svg>
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
                <div className="mt-12 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                    <h2 className="text-xl font-black tracking-widest uppercase text-indigo-400 mb-6 border-b border-gray-800 pb-4">My Portfolio</h2>

                    {myOrders.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">You have no active or completed orders.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-bold px-4">Type</th>
                                        <th className="pb-3 font-bold px-4">Item</th>
                                        <th className="pb-3 font-bold px-4">Qty</th>
                                        <th className="pb-3 font-bold px-4">Price</th>
                                        <th className="pb-3 font-bold px-4">Status</th>
                                        <th className="pb-3 font-bold px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myOrders.map(order => (
                                        <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${order.order_type === 'Buy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'}`}>
                                                    {order.order_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-gray-200">{order.item_name}</td>
                                            <td className="py-4 px-4 text-gray-400">{order.quantity}</td>
                                            <td className="py-4 px-4 text-amber-400 font-mono text-sm">{order.price}</td>
                                            <td className="py-4 px-4">
                                                <span className={`text-xs font-bold ${order.status === 'Open' ? 'text-indigo-400' : order.status === 'Fulfilled' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.status === 'Open' && (
                                                        <>
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Fulfilled')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded text-xs font-bold transition-colors">Mark Fulfilled</button>
                                                            <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="px-3 py-1 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 rounded text-xs font-bold transition-colors">Cancel</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDelete(order.id)} className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors" title="Delete Form Record">
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-[#0d131f] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl shadow-amber-900/20 overflow-hidden transform transition-all">
                        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/10 p-6 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="text-amber-500">⚖️</span> Post Market Order
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Order Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewOrderType('Buy')}
                                        className={`py-2 rounded-lg font-bold text-sm transition-all border ${newOrderType === 'Buy' ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-900 text-gray-500 border-gray-800 hover:bg-gray-800'}`}
                                    >Buy Order</button>
                                    <button
                                        type="button"
                                        onClick={() => setNewOrderType('Sell')}
                                        className={`py-2 rounded-lg font-bold text-sm transition-all border ${newOrderType === 'Sell' ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-gray-900 text-gray-500 border-gray-800 hover:bg-gray-800'}`}
                                    >Sell Order</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    placeholder="e.g. Iron Ingot, Darkwood Bow"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newQuantity}
                                        onChange={e => setNewQuantity(parseInt(e.target.value))}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Price (Total or Ea)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        placeholder="e.g. 50k Gold"
                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-black py-3 px-6 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all text-lg"
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
