import { useNavigate, useParams } from 'react-router-dom';

export function FoodListingDetails() {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div className="p-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-sm text-blue-600 hover:underline"
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold text-gray-800">
                Food Listing Details
            </h1>

            <p className="mt-2 text-sm text-gray-500">
                Listing ID: {id}
            </p>
        </div>
    );
}