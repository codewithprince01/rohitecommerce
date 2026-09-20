export interface GroupedCategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  isWide?: boolean;
}

export interface CategoryGroup {
  id: string;
  title: string;
  items: GroupedCategoryItem[];
}

export const categoryGroupsData: CategoryGroup[] = [
  {
    id: 'grocery-kitchen',
    title: 'Grocery & Kitchen',
    items: [
      {
        id: 'gk-1',
        name: 'Fruits & Vegetables',
        slug: 'vegetables',
        image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-2',
        name: 'Dairy, Bread & Eggs',
        slug: 'dairy',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-3',
        name: 'Atta, Rice, Oil & Dals',
        slug: 'staples',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-4',
        name: 'Meat, Fish & Eggs',
        slug: 'dairy',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-5',
        name: 'Masala & Dry Fruits',
        slug: 'snacks-namkeen',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-6',
        name: 'Breakfast & Sauces',
        slug: 'bakery',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'gk-7',
        name: 'Packaged Food',
        slug: 'instant-food',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
  {
    id: 'snacks-drinks',
    title: 'Snacks & Drinks',
    items: [
      {
        id: 'sd-1',
        name: 'Zepto Cafe',
        slug: 'beverages',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-2',
        name: 'Tea, Coffee & More',
        slug: 'beverages',
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-3',
        name: 'Ice Creams & More',
        slug: 'dairy',
        image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-4',
        name: 'Frozen Food',
        slug: 'instant-food',
        image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-5',
        name: 'Sweet Cravings',
        slug: 'bakery',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-6',
        name: 'Cold Drinks & Juices',
        slug: 'beverages',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-7',
        name: 'Munchies',
        slug: 'snacks-namkeen',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'sd-8',
        name: 'Biscuits & Cookies',
        slug: 'bakery',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
  {
    id: 'fashion-lifestyle',
    title: 'Fashion & Lifestyle',
    items: [
      {
        id: 'fl-1',
        name: 'Apparel',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'fl-2',
        name: 'Jewellery',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
  {
    id: 'beauty-personal-care',
    title: 'Beauty & Personal Care',
    items: [
      {
        id: 'bpc-1',
        name: 'Personal Care Studio',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-2',
        name: 'Skincare',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-3',
        name: 'Makeup & Beauty',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-4',
        name: 'Fragrance',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-5',
        name: 'Bath & Body',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1608248597359-57357492c686?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-6',
        name: 'Haircare',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-7',
        name: 'Baby Care',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-8',
        name: 'Protein & Nutrition',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-9',
        name: 'Pharmacy & Wellness',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-10',
        name: 'Feminine Hygiene',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'bpc-11',
        name: 'Sexual Wellness',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
  {
    id: 'household-essentials',
    title: 'Household Essentials',
    items: [
      {
        id: 'he-1',
        name: 'Home Needs',
        slug: 'cleaning',
        image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'he-2',
        name: 'Kitchenware & Appliances',
        slug: 'cleaning',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'he-3',
        name: 'Cleaning Essentials',
        slug: 'cleaning',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'he-4',
        name: 'Electronics Store',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'he-5',
        name: 'Pet Care',
        slug: 'staples',
        image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'he-6',
        name: 'Paan Corner',
        slug: 'snacks-namkeen',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
  {
    id: 'hobbies-interests',
    title: 'Hobbies & Interests',
    items: [
      {
        id: 'hi-1',
        name: 'Toys & Games',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'hi-2',
        name: 'Stationery & Crafts',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'hi-3',
        name: 'Sports & Fitness',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
      {
        id: 'hi-4',
        name: 'Book Store',
        slug: 'personal-care',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      },
    ],
  },
];
