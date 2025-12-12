import type { Restaurant } from '../../hooks/useFirebaseRestaurant';

interface RestaurantsTabProps {
  restaurant: Restaurant;
}

export function RestaurantsTab({ restaurant }: RestaurantsTabProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Details</h2>
      <p className="-mt-4 mb-4 text-sm text-gray-500">To edit these details, go to the Settings tab.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm">{restaurant.id}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.description || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 whitespace-nowrap overflow-x-auto text-sm">{restaurant.phone || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 break-words text-sm">{restaurant.email || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
