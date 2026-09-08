import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { Plus, ArrowDownRight, ArrowUpRight, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditCategoryModal } from '../components/EditCategoryModal';
export const CategoriesView = ({ categories, onReload }) => {
    const [tab, setTab] = useState('expense');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    // Form states
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('ShoppingBag');
    const [color, setColor] = useState('#29c184');
    const [budgetLimitStr, setBudgetLimitStr] = useState('');
    const [loading, setLoading] = useState(false);
    const handleUpdateCategory = async (id, updates) => {
        await api.updateCategory(id, updates);
        onReload();
    };
    const handleDeleteCategory = async (id) => {
        await api.deleteCategory(id);
        onReload();
    };
    const filtered = categories.filter((c) => c.type === tab);
    const icons = [
        'Utensils', 'Car', 'Coffee', 'Home', 'ShoppingBag', 'HeartPulse', 'BookOpen',
        'Film', 'Briefcase', 'Laptop', 'Gift', 'DollarSign', 'Smartphone', 'Zap'
    ];
    const colors = ['#29c184', '#1570ef', '#ff8d28', '#7a5af8', '#f0646e', '#ec4899', '#eab308', '#06b6d4'];
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!name)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await api.createCategory({
                name,
                type: tab,
                icon,
                color,
                budget_limit: parseFloat(budgetLimitStr) || 0
            });
            confetti({ particleCount: 30, spread: 60 });
            setShowAddModal(false);
            setName('');
            setBudgetLimitStr('');
            onReload();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Kategoriyalar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Toifalar va oylik byudjet limitlari" })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            setShowAddModal(true);
                        }, className: "flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer", children: [_jsx(Plus, { className: "w-4 h-4 stroke-[3]" }), _jsx("span", { children: "Yangi Kategoriya" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]", children: [_jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            setTab('expense');
                        }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'expense'
                            ? 'bg-[#f0646e] text-white shadow-sm'
                            : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowDownRight, { className: "w-4 h-4" }), _jsx("span", { children: "Xarajat Toifalari" })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            setTab('income');
                        }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'income'
                            ? 'bg-[#29c184] text-white shadow-sm'
                            : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowUpRight, { className: "w-4 h-4" }), _jsx("span", { children: "Daromad Toifalari" })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-2.5", children: filtered.map((cat) => (_jsxs("div", { onClick: () => {
                        triggerHaptic('light');
                        setSelectedCategory(cat);
                    }, className: "p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] hover:border-[#29c184]/50 shadow-sm flex items-center justify-between cursor-pointer transition-all group", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform", style: { backgroundColor: cat.color }, children: _jsx(Icon, { name: cat.icon, size: 18 }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939] truncate group-hover:text-[#29c184] transition-colors", children: cat.name }), cat.budget_limit > 0 ? (_jsxs("p", { className: "text-[10px] text-[#29c184] font-medium truncate", children: ["Limit: ", cat.budget_limit.toLocaleString('uz-UZ')] })) : (_jsx("p", { className: "text-[10px] text-[#899098]", children: "Cheklovsiz" }))] })] }), _jsx("div", { className: "w-6 h-6 rounded-md bg-[#19232e] opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#899098] hover:text-white transition-all shrink-0", children: _jsx(Edit3, { className: "w-3 h-3" }) })] }, cat.id))) }), showAddModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4", children: [_jsx("h3", { className: "font-bold text-lg text-white", children: "Yangi Kategoriya Yaratish" }), _jsxs("form", { onSubmit: handleCreateCategory, className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Nomi" }), _jsx("input", { type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "Masalan: Sport, Kitoblar, Kantselyariya", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Oylik byudjet limiti (so'm, ixtiyoriy)" }), _jsx("input", { type: "number", value: budgetLimitStr, onChange: (e) => setBudgetLimitStr(e.target.value), placeholder: "0 (cheklovsiz)", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Ikonka" }), _jsx("div", { className: "grid grid-cols-7 gap-1.5 py-1.5", children: icons.map((ic) => (_jsx("button", { type: "button", onClick: () => setIcon(ic), className: `p-2 rounded-xl border flex items-center justify-center ${icon === ic ? 'bg-[#29c184] text-white border-[#29c184]' : 'bg-[#213040] text-[#899098] border-[#354454]'}`, children: _jsx(Icon, { name: ic, size: 16 }) }, ic))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Rang" }), _jsx("div", { className: "flex gap-2 py-1", children: colors.map((c) => (_jsx("button", { type: "button", onClick: () => setColor(c), className: `w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`, style: { backgroundColor: c } }, c))) })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setShowAddModal(false), className: "px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white", children: "Bekor qilish" }), _jsx("button", { type: "submit", disabled: loading, className: "px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: "Yaratish" })] })] })] }) })), _jsx(EditCategoryModal, { isOpen: !!selectedCategory, onClose: () => setSelectedCategory(null), category: selectedCategory, onUpdate: handleUpdateCategory, onDelete: handleDeleteCategory })] }));
};
