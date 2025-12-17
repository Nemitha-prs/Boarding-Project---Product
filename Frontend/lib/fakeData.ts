export interface BoardingListing {
  id: number;
  title: string;
  description: string;
  price: string;
  image: string;
  location: string;
  district: string;
  areaCode?: string | null;
  roomType: string;
  distance: string;
  rating: number;
  facilities: string[];
  availableBeds?: number;
}

export const listings: BoardingListing[] = [
  {
    id: 1,
    title: "Cozy Room Near Campus",
    description: "Comfortable room with private bathroom and fast Wi-Fi. Perfect for students who need a quiet study environment.",
    price: "Rs. 15,000",
    image: "/images/board1.jpg",
    location: "Cinnamon Gardens",
    district: "Colombo",
    areaCode: "Colombo 07",
    roomType: "Single Room",
    distance: "0.5 km",
    rating: 4.8,
    facilities: ["Wi-Fi", "AC", "Private Bath"]
  },
  {
    id: 2,
    title: "Modern Studio Apartment",
    description: "Fully furnished studio with kitchen and balcony views. Includes gym access and 24/7 security.",
    price: "Rs. 35,000",
    image: "/images/board2.jpg",
    location: "Nugegoda",
    district: "Colombo",
    areaCode: "Nugegoda",
    roomType: "Studio",
    distance: "1.2 km",
    rating: 4.9,
    facilities: ["Kitchen", "Gym", "Security"]
  },
  {
    id: 3,
    title: "Shared Room for Students",
    description: "Affordable shared room close to university and transport. Great community atmosphere.",
    price: "Rs. 8,500",
    image: "/images/board3.jpg",
    location: "Malabe",
    district: "Colombo",
    areaCode: null,
    roomType: "Shared Room",
    distance: "0.2 km",
    rating: 4.5,
    facilities: ["Shared Bath", "Common Area"],
    availableBeds: 2
  },
  {
    id: 4,
    title: "Luxury Student Suite",
    description: "Premium suite with all amenities included. Walking distance to major faculties.",
    price: "Rs. 45,000",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    location: "Rajagiriya",
    district: "Colombo",
    areaCode: null,
    roomType: "Suite",
    distance: "0.8 km",
    rating: 5.0,
    facilities: ["AC", "Hot Water", "Parking"]
  },
  {
    id: 5,
    title: "Budget Friendly Annex",
    description: "Simple and clean annex for students on a budget. Separate entrance and electricity meter.",
    price: "Rs. 12,000",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    location: "Maharagama",
    district: "Colombo",
    areaCode: "Maharagama",
    roomType: "Annex",
    distance: "2.0 km",
    rating: 4.2,
    facilities: ["Separate Entrance", "Garden"]
  },
  {
    id: 6,
    title: "Garden View Room",
    description: "Peaceful room overlooking a beautiful garden. Ideal for nature lovers.",
    price: "Rs. 18,000",
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
    location: "Battaramulla",
    district: "Colombo",
    areaCode: null,
    roomType: "Single Room",
    distance: "1.5 km",
    rating: 4.7,
    facilities: ["Garden View", "Quiet"]
  }
];
