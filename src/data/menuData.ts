export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  image?: string;
}

export const menuSections: MenuSection[] = [
  {
    id: 'veg-starters',
    title: 'Vegetarian Starters',
    items: [
      {
        name: 'Samosa Trio',
        description: 'Crispy pastries with potato & peas',
        price: '₹150',
      },
      {
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese with spices',
        price: '₹280',
      },
      {
        name: 'Onion Bhaji',
        description: 'Golden-fried onion fritters',
        price: '₹120',
      },
      {
        name: 'Aloo Tikki',
        description: 'Crispy potato patties with mint chutney',
        price: '₹140',
      },
    ],
  },
  {
    id: 'nonveg-starters',
    title: 'Non-Vegetarian Starters',
    items: [
      {
        name: 'Chicken Tikka',
        description: 'Marinated and grilled chicken pieces',
        price: '₹320',
      },
      {
        name: 'Fish Pakora',
        description: 'Crispy battered fish fritters',
        price: '₹300',
      },
      {
        name: 'Tandoori Prawns',
        description: 'Juicy prawns with traditional spices',
        price: '₹380',
      },
      {
        name: 'Lamb Seekh Kabab',
        description: 'Minced lamb skewered and grilled',
        price: '₹350',
      },
    ],
  },
  {
    id: 'veg-main',
    title: 'Vegetarian Main Course',
    items: [
      {
        name: 'Saag Paneer',
        description: 'Cottage cheese in spinach curry',
        price: '₹380',
      },
      {
        name: 'Dal Makhani',
        description: 'Lentils with cream and aromatics',
        price: '₹300',
      },
      {
        name: 'Chana Masala',
        description: 'Spiced chickpea curry',
        price: '₹280',
      },
      {
        name: 'Vegetable Biryani',
        description: 'Fragrant rice with mixed vegetables',
        price: '₹350',
      },
      {
        name: 'Malai Kofta',
        description: 'Cottage cheese dumplings in creamy sauce',
        price: '₹420',
      },
    ],
  },
  {
    id: 'nonveg-main',
    title: 'Non-Vegetarian Main Course',
    items: [
      {
        name: 'Butter Chicken',
        description: 'Tender chicken in creamy tomato sauce',
        price: '₹450',
      },
      {
        name: 'Chicken Biryani',
        description: 'Fragrant rice with spiced chicken',
        price: '₹420',
      },
      {
        name: 'Lamb Rogan Josh',
        description: 'Tender lamb in aromatic curry',
        price: '₹520',
      },
      {
        name: 'Fish Curry',
        description: 'Fresh fish in coconut-based sauce',
        price: '₹480',
      },
      {
        name: 'Tandoori Chicken',
        description: 'Half chicken marinated and roasted',
        price: '₹500',
      },
    ],
  },
  {
    id: 'mocktails',
    title: 'Mocktails',
    items: [
      {
        name: 'Mango Lassi',
        description: 'Yogurt-based drink with fresh mango',
        price: '₹150',
      },
      {
        name: 'Jaljeera',
        description: 'Traditional spiced cumin drink',
        price: '₹100',
      },
      {
        name: 'Rose Sherbet',
        description: 'Sweet rose-flavored chilled drink',
        price: '₹120',
      },
      {
        name: 'Aam Panna',
        description: 'Raw mango cooler with spices',
        price: '₹110',
      },
    ],
  },
  {
    id: 'cocktails',
    title: 'Cocktails',
    items: [
      {
        name: 'Spiced Margarita',
        description: 'Tequila with Indian spice twist',
        price: '₹350',
      },
      {
        name: 'Cardamom Old Fashioned',
        description: 'Whiskey with cardamom infusion',
        price: '₹400',
      },
      {
        name: 'Turmeric Mojito',
        description: 'Rum with turmeric and fresh mint',
        price: '₹320',
      },
      {
        name: 'Saffron Martini',
        description: 'Vodka infused with saffron and rose',
        price: '₹380',
      },
    ],
  },
  {
    id: 'desserts',
    title: 'Desserts',
    items: [
      {
        name: 'Gulab Jamun',
        description: 'Sweet milk solids in cardamom syrup',
        price: '₹150',
      },
      {
        name: 'Kheer',
        description: 'Rice pudding with nuts and saffron',
        price: '₹140',
      },
      {
        name: 'Rasmalai',
        description: 'Soft cheese in sweetened cream',
        price: '₹180',
      },
      {
        name: 'Jalebi',
        description: 'Spiral-shaped sweet soaked in syrup',
        price: '₹130',
      },
    ],
  },
];

export const todaysSpecial: MenuItem = {
  name: 'Chef\'s Special Rogan Josh',
  description: 'A traditional recipe passed down through generations - tender lamb cooked with aromatic spices and yogurt',
  price: '₹550',
};

export const upcomingEvents: Event[] = [
  {
    id: 'event-1',
    title: 'One Man Show Performance',
    date: 'Saturday',
    time: '8:00 PM - 9:30 PM',
    description: 'Join us for an evening of comedy and entertainment by renowned performer Rajesh Kumar. Dinner available during the show.',
  },
  {
    id: 'event-2',
    title: 'Live Tabla Performance',
    date: 'Sunday',
    time: '7:00 PM - 8:30 PM',
    description: 'Experience the rhythmic beats of traditional Indian tabla performance by maestro Vikram Singh.',
  },
  {
    id: 'event-3',
    title: 'Classical Sitar Night',
    date: 'Wednesday',
    time: '7:30 PM - 9:00 PM',
    description: 'Evening of Hindustani classical music featuring sitar master Priya Sharma.',
  },
  {
    id: 'event-4',
    title: 'Bhangra Dance Night',
    date: 'Friday',
    time: '9:00 PM - 11:00 PM',
    description: 'High-energy Bhangra dancing with DJ Amar. Full bar available.',
  },
];
