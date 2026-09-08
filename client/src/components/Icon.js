import { jsx as _jsx } from "react/jsx-runtime";
import * as LucideIcons from 'lucide-react';
export const Icon = ({ name, className = 'w-5 h-5', size, color }) => {
    const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
    return _jsx(IconComponent, { className: className, size: size, color: color });
};
