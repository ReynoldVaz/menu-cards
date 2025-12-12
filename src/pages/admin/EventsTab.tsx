import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, deleteField } from 'firebase/firestore';
import type { Event } from '../../data/menuData';
import { EventForm, type EventFormData } from '../../components/EventForm';

interface EventsTabProps {
  restaurantId: string;
}

export function EventsTab({ restaurantId }: EventsTabProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, [restaurantId]);

  async function loadEvents() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, `restaurants/${restaurantId}/events`));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent(formData: EventFormData) {
    try {
      setSavingEvent(true);
      const docRef = await addDoc(collection(db, `restaurants/${restaurantId}/events`), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add to local state
      setEvents([
        ...events,
        {
          id: docRef.id,
          ...formData,
        } as unknown as Event,
      ]);

      setShowForm(false);
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleUpdateEvent(formData: EventFormData) {
    if (!editingEvent?.id) return;

    try {
      setSavingEvent(true);
      const eventData: any = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      if (!formData.image) {
        eventData.image = deleteField();
      }

      await updateDoc(
        doc(db, `restaurants/${restaurantId}/events/${editingEvent.id}`),
        eventData
      );

      // Update local state
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id
            ? ({ ...event, ...eventData } as unknown as Event)
            : event
        )
      );

      setEditingEvent(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string | undefined) {
    if (!eventId || !confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, `restaurants/${restaurantId}/events/${eventId}`));
      setEvents(events.filter((event) => event.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Events ({events.length})</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              ➕ Add Event
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-600">No events yet. Click "Add Event" to get started!</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        📅 {event.date} at 🕐 {event.time}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                      {(event as any).image && (
                        <img
                          src={(event as any).image}
                          alt={event.title}
                          className="w-24 h-24 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <EventForm
            restaurantCode={restaurantId}
            initialData={
              editingEvent
                ? {
                    title: editingEvent.title,
                    date: editingEvent.date,
                    time: editingEvent.time,
                    description: editingEvent.description,
                    image: (editingEvent as any).image || '',
                  }
                : undefined
            }
            onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
            isLoading={savingEvent}
          />
        </>
      )}
    </div>
  );
}
