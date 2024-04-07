

export interface ProviderProps {
    children?: any;
}

export function Providers({ children }: ProviderProps) {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}
