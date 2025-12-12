import type { Restaurant } from '../../hooks/useFirebaseRestaurant';

interface RestaurantsTabProps {
  restaurant: Restaurant;
}

export function RestaurantsTab({ restaurant }: RestaurantsTabProps) {
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Details</h2>
      <p className="-mt-4 mb-4 text-sm text-gray-500">To edit these details, go to the Settings tab.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <p className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">{restaurant.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
          <p className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] font-mono text-sm">{restaurant.id}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <p className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">{restaurant.description || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <p className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] whitespace-nowrap overflow-x-auto text-sm">{restaurant.phone || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <p className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] break-words text-sm">{restaurant.email || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
