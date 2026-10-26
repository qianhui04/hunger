import type { ReactNode } from 'react';

type CardContainerProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

export default function CardContainer({
    title,
    description,
    children,
}: CardContainerProps) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-gray-500">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}