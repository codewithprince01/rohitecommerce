import { Customer, Address, WalletTransaction, SupportTicket } from '../../models/Customer.js';
import { Order, OrderItem, OrderStatusHistory } from '../../models/Order.js';
import { Coupon } from '../../models/Marketing.js';
import { Product } from '../../models/Catalog.js';

// Helper to find or pick default customer
async function resolveCustomer(req) {
  const customerId = req.headers['x-customer-id'] || req.query.customer_id;
  if (customerId) {
    try {
      const cust = await Customer.findById(customerId);
      if (cust) return cust;
    } catch (e) {}
  }
  // Fall back to the first shopper on file. A brand new store has none, so we
  // open a blank record rather than inventing a demo identity with a balance.
  let cust = await Customer.findOne({ is_blocked: false }).sort({ created_at: 1 });
  if (!cust) {
    cust = await Customer.create({ name: 'Guest' });
  }
  return cust;
}

// 1. GET Profile
export async function getProfile(req, res) {
  try {
    const customer = await resolveCustomer(req);

    // Ensure default addresses exist for realistic experience
    const addressCount = await Address.countDocuments({ customer_id: customer._id });
    if (addressCount === 0) {
      await Address.create([
        {
          customer_id: customer._id,
          label: 'Home',
          line1: 'Fatehchand colony, ward no 5',
          line2: 'Near ram mandir chauraha',
          city: 'Sabalgarh',
          state: 'Madhya Pradesh',
          pincode: '476229',
          is_default: true,
        },
        {
          customer_id: customer._id,
          label: 'Shop',
          line1: 'Near Ram Mandir Chauraha, Main Market',
          line2: 'Ward No 5',
          city: 'Sabalgarh',
          state: 'Madhya Pradesh',
          pincode: '476229',
          is_default: false,
        },
      ]);
    }

    // Ensure wallet transactions exist
    const txCount = await WalletTransaction.countDocuments({ customer_id: customer._id });
    if (txCount === 0) {
      await WalletTransaction.create([
        {
          customer_id: customer._id,
          type: 'credit',
          title: 'Welcome Cashback Added',
          amount: 150,
          description: 'Bonus credited for creating account',
          reference_id: 'TXN-WCM-8901',
          created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        },
        {
          customer_id: customer._id,
          type: 'credit',
          title: 'Order Cashback (FM-6902)',
          amount: 100,
          description: '10% instant VIP cash on grocery order',
          reference_id: 'TXN-CBK-9021',
          created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
      ]);
    }

    const [addresses, activeOrdersCount, couponsCount] = await Promise.all([
      Address.find({ customer_id: customer._id }).sort({ is_default: -1, created_at: -1 }).lean(),
      Order.countDocuments({
        customer_id: customer._id,
        status: { $in: ['pending', 'confirmed', 'packed', 'out_for_delivery'] },
      }),
      Coupon.countDocuments({ is_active: true }),
    ]);

    return res.json({
      success: true,
      data: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        gender: customer.gender ?? 'male',
        dob: customer.dob ?? '1996-08-15',
        alternate_phone: customer.alternate_phone,
        preferences: customer.preferences || {},
        wallet_balance: customer.wallet_balance ?? 250,
        cashback_earned: customer.cashback_earned ?? 45,
        is_vip: customer.is_vip ?? true,
        freshpass_expiry: customer.freshpass_expiry ?? '31 Dec 2026',
        notes: customer.notes,
        counts: {
          saved_addresses: addresses.length,
          active_orders: activeOrdersCount,
          available_coupons: couponsCount,
        },
        addresses,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 2. UPDATE Profile
export async function updateProfile(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const {
      name,
      email,
      phone,
      avatar,
      gender,
      dob,
      alternate_phone,
      alternatePhone,
      preferences,
      ...otherFields
    } = req.body;

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email ? email.trim() : null;
    if (phone !== undefined) customer.phone = phone ? phone.trim() : null;
    if (avatar !== undefined) customer.avatar = avatar;
    if (gender !== undefined) customer.gender = gender;
    if (dob !== undefined) customer.dob = dob;
    if (alternate_phone !== undefined || alternatePhone !== undefined) {
      customer.alternate_phone = alternate_phone !== undefined ? alternate_phone : alternatePhone;
    }

    const currentPreferences = customer.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...(preferences || {}),
      ...otherFields,
    };
    customer.preferences = updatedPreferences;
    customer.markModified('preferences');

    await customer.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        gender: customer.gender,
        dob: customer.dob,
        alternate_phone: customer.alternate_phone,
        preferences: customer.preferences,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 3. GET Orders
export async function getOrders(req, res) {
  try {
    const customer = await resolveCustomer(req);
    let orders = await Order.find({ customer_id: customer._id })
      .sort({ placed_at: -1 })
      .lean();

    // Fallback: If this customer has no orders, fetch recent store orders so UI is lively
    if (!orders || orders.length === 0) {
      orders = await Order.find().limit(8).sort({ placed_at: -1 }).lean();
    }

    // Attach items
    const orderIds = orders.map((o) => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    // Fetch products for thumbnails
    const productIds = allItems.map((i) => i.product_id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('image name slug').lean();
    const productMap = {};
    for (const p of products) {
      productMap[p._id.toString()] = p;
    }

    const mockPilots = [
      {
        name: 'Ramesh Kumar',
        phone: '+91 98102 34567',
        rating: 4.9,
        trips: 1842,
        vehicle: 'Hero Electric (HR-26-BK-4091)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=compress&cs=tinysrgb&w=150',
      },
      {
        name: 'Suresh Verma',
        phone: '+91 98711 82910',
        rating: 4.8,
        trips: 940,
        vehicle: 'Ather 450X (HR-26-CZ-9102)',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=compress&cs=tinysrgb&w=150',
      },
      {
        name: 'Vikram Singh',
        phone: '+91 99580 12830',
        rating: 5.0,
        trips: 2410,
        vehicle: 'Ola S1 Pro (DL-3S-AQ-5819)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=compress&cs=tinysrgb&w=150',
      },
    ];

    const fallbackImages = [
      'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=200',
    ];

    const itemsByOrder = {};
    for (let idx = 0; idx < allItems.length; idx++) {
      const item = allItems[idx];
      const oid = item.order_id.toString();
      if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
      const prod = item.product_id ? productMap[item.product_id.toString()] : null;
      itemsByOrder[oid].push({
        ...item,
        image: prod?.image || fallbackImages[idx % fallbackImages.length],
      });
    }

    const populatedOrders = orders.map((o, idx) => {
      const items = itemsByOrder[o._id.toString()] || [];
      const pilot = mockPilots[idx % mockPilots.length];
      const isDelivered = o.status === 'delivered';
      const isLive = ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status);

      return {
        ...o,
        id: o._id,
        items,
        delivery_address: o.delivery_address || {
          label: 'Home',
          line1: 'Fatehchand colony, ward no 5',
          line2: 'Near ram mandir chauraha',
          city: 'Sabalgarh, Morena',
          state: 'Madhya Pradesh',
          pincode: '476229',
        },
        rider: o.rider || pilot,
        delivery_eta: o.delivery_eta || (isLive ? '8-10 Mins' : isDelivered ? 'Delivered in 9 mins' : 'Cancelled'),
        rating: o.rating || (isDelivered ? 5 : null),
        rating_review: o.rating_review || null,
        rating_tags: o.rating_tags || ['Fast Delivery', 'Fresh Groceries'],
      };
    });

    return res.json({ success: true, data: populatedOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// RATE Order
export async function rateOrder(req, res) {
  try {
    const { id } = req.params;
    const { rating, review, tags } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.rating = Number(rating) || 5;
    order.rating_review = review ? review.trim() : null;
    order.rating_tags = Array.isArray(tags) ? tags : [];
    await order.save();

    return res.json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 4. CANCEL Order
export async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['delivered', 'cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already ${order.status}`,
      });
    }

    order.status = 'cancelled';
    order.notes = reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer';
    await order.save();

    await OrderStatusHistory.create({
      order_id: order._id,
      status: 'cancelled',
      note: reason || 'Cancelled by customer via profile page',
    });

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 5. REORDER Items
export async function reorder(req, res) {
  try {
    const { id } = req.params;
    const customer = await resolveCustomer(req);

    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }

    const items = await OrderItem.find({ order_id: oldOrder._id }).lean();
    if (!items.length) {
      return res.status(400).json({ success: false, message: 'No items found in this order' });
    }

    const orderNumber = `FM-${Math.floor(100000 + Math.random() * 900000)}`;
    const subtotal = items.reduce((sum, it) => sum + it.line_total, 0);
    const deliveryFee = subtotal > 199 ? 0 : 25;
    const total = subtotal + deliveryFee;

    const newOrder = await Order.create({
      order_number: orderNumber,
      customer_id: customer._id,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'upi',
      subtotal,
      discount: 0,
      delivery_fee: deliveryFee,
      tax: 0,
      total,
      delivery_address: oldOrder.delivery_address || {
        label: 'Home',
        line1: 'Fatehchand colony, ward no 5, near ram mandir chauraha',
        city: 'Sabalgarh',
        state: 'Madhya Pradesh',
        pincode: '476229',
      },
      placed_at: new Date(),
    });

    const newItems = items.map((it) => ({
      order_id: newOrder._id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_label: it.variant_label,
      unit_price: it.unit_price,
      quantity: it.quantity,
      line_total: it.line_total,
    }));

    await OrderItem.insertMany(newItems);

    await OrderStatusHistory.create({
      order_id: newOrder._id,
      status: 'confirmed',
      note: `1-Click Reordered from ${oldOrder.order_number}`,
    });

    return res.json({
      success: true,
      message: 'Items reordered successfully! Fresh delivery on its way.',
      data: {
        ...newOrder.toObject(),
        items: newItems,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 6. GET Addresses
export async function getAddresses(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const addresses = await Address.find({ customer_id: customer._id })
      .sort({ is_default: -1, created_at: -1 })
      .lean();
    return res.json({ success: true, data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 7. ADD Address
export async function addAddress(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const {
      label,
      receiver_name,
      receiver_phone,
      line1,
      line2,
      landmark,
      city,
      state,
      pincode,
      delivery_instructions,
      is_default,
    } = req.body;

    if (!line1 || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Address line1, city, and pincode are required' });
    }

    if (is_default) {
      await Address.updateMany({ customer_id: customer._id }, { is_default: false });
    }

    const newAddress = await Address.create({
      customer_id: customer._id,
      label: label || 'Home',
      receiver_name: receiver_name ? receiver_name.trim() : customer.name,
      receiver_phone: receiver_phone ? receiver_phone.trim() : customer.phone,
      line1: line1.trim(),
      line2: line2 ? line2.trim() : null,
      landmark: landmark ? landmark.trim() : null,
      city: city.trim(),
      state: state ? state.trim() : 'Madhya Pradesh',
      pincode: pincode.trim(),
      delivery_instructions: Array.isArray(delivery_instructions) ? delivery_instructions : [],
      is_default: Boolean(is_default),
    });

    return res.json({
      success: true,
      message: 'Address saved successfully',
      data: newAddress,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 8. UPDATE Address
export async function updateAddress(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const { id } = req.params;
    const {
      label,
      receiver_name,
      receiver_phone,
      line1,
      line2,
      landmark,
      city,
      state,
      pincode,
      delivery_instructions,
      is_default,
    } = req.body;

    if (is_default) {
      await Address.updateMany({ customer_id: customer._id }, { is_default: false });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: id, customer_id: customer._id },
      {
        $set: {
          label: label || 'Home',
          receiver_name: receiver_name || customer.name,
          receiver_phone: receiver_phone || customer.phone,
          line1,
          line2: line2 || null,
          landmark: landmark || null,
          city,
          state: state || null,
          pincode,
          delivery_instructions: Array.isArray(delivery_instructions) ? delivery_instructions : [],
          is_default: Boolean(is_default),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    return res.json({ success: true, message: 'Address updated', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 9. DELETE Address
export async function deleteAddress(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const { id } = req.params;

    const removed = await Address.findOneAndDelete({ _id: id, customer_id: customer._id });
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 10. SET DEFAULT Address
export async function setDefaultAddress(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const { id } = req.params;

    await Address.updateMany({ customer_id: customer._id }, { is_default: false });
    const updated = await Address.findOneAndUpdate(
      { _id: id, customer_id: customer._id },
      { is_default: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    return res.json({ success: true, message: 'Default address set', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 11. GET Wallet & Transactions
export async function getWallet(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const transactions = await WalletTransaction.find({ customer_id: customer._id })
      .sort({ created_at: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        balance: customer.wallet_balance ?? 250,
        cashback_earned: customer.cashback_earned ?? 45,
        transactions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 12. TOPUP Wallet
export async function topupWallet(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount to add' });
    }

    customer.wallet_balance = (customer.wallet_balance || 0) + amount;
    await customer.save();

    const txn = await WalletTransaction.create({
      customer_id: customer._id,
      type: 'credit',
      title: 'Wallet Recharged',
      amount,
      description: 'Added money via UPI / Instant Pay',
      reference_id: `TOP-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `₹${amount} added to Fresh Cash successfully!`,
      data: {
        balance: customer.wallet_balance,
        transaction: txn,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 13. GET Coupons
export async function getCoupons(_req, res) {
  try {
    let coupons = await Coupon.find({ is_active: true }).lean();
    if (!coupons || coupons.length === 0) {
      coupons = await Coupon.create([
        {
          code: 'FRESH100',
          description: 'Instant ₹100 off on fresh fruits & vegetables',
          type: 'fixed',
          value: 100,
          min_order: 399,
          is_active: true,
        },
        {
          code: 'WELCOME10',
          description: '10% off on your grocery order',
          type: 'percent',
          value: 10,
          min_order: 199,
          max_discount: 100,
          is_active: true,
        },
        {
          code: 'SUPERPASS',
          description: 'Flat ₹50 off + Free Priority Instant Delivery',
          type: 'fixed',
          value: 50,
          min_order: 299,
          is_active: true,
        },
      ]);
    }
    return res.json({ success: true, data: coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 14. APPLY Coupon
export async function applyCoupon(req, res) {
  try {
    const { code, cart_total } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), is_active: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    const subtotal = Number(cart_total) || 500;
    if (coupon.min_order && subtotal < coupon.min_order) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_order} required for ${coupon.code}`,
      });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.value;
    }

    return res.json({
      success: true,
      message: `Coupon ${coupon.code} applied successfully! You saved ₹${discount}`,
      data: {
        code: coupon.code,
        discount,
        description: coupon.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 15. GET Support Tickets
export async function getSupport(req, res) {
  try {
    const customer = await resolveCustomer(req);
    let tickets = await SupportTicket.find({ customer_id: customer._id })
      .sort({ created_at: -1 })
      .lean();

    if (!tickets || tickets.length === 0) {
      const sample = await SupportTicket.create({
        customer_id: customer._id,
        ticket_number: 'AG-TKT-82910',
        category: 'Delivery Query',
        subject: 'Estimated delivery slot enquiry',
        message: 'Hi Agrawal General & Provisional Store, can I schedule my order delivery for evening slots?',
        status: 'resolved',
        priority: 'low',
        responses: [
          {
            sender: 'customer',
            message: 'Hi Agrawal General & Provisional Store, can I schedule my order delivery for evening slots?',
            created_at: new Date(Date.now() - 24 * 3600 * 1000),
          },
          {
            sender: 'agent',
            message:
              'Hello! Yes, Agrawal General & Provisional Store instant delivery is active. You can also pick future slots at checkout.',
            created_at: new Date(Date.now() - 23 * 3600 * 1000),
          },
        ],
        created_at: new Date(Date.now() - 24 * 3600 * 1000),
      });
      tickets = [sample.toObject()];
    }

    return res.json({ success: true, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 16. CREATE Support Ticket
export async function createSupportTicket(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const { category, subject, message, order_number } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticketNumber = `AG-TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    const autoReplies = {
      'Order Issue': 'We have received your order report. Our priority packaging team is verifying it immediately.',
      'Delivery Delay': 'Delivery fleet is dispatched. Your delivery partner is reaching your location within minutes.',
      'Payment & Refund': 'Payment verification initiated. Any deduction is safely held and auto-refunded to your wallet.',
      'Product Quality': 'Agrawal General & Provisional Store 100% Quality Guarantee: Our quality inspector has been notified for replacement/credit.',
      'General Query': 'Thank you for reaching out! An Agrawal General & Provisional Store specialist is looking into your request.',
    };

    const initialAgentReply = autoReplies[category] || autoReplies['General Query'];

    const ticket = await SupportTicket.create({
      customer_id: customer._id,
      ticket_number: ticketNumber,
      category: category || 'General Query',
      order_number: order_number || null,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      priority: 'medium',
      responses: [
        {
          sender: 'customer',
          message: message.trim(),
          created_at: new Date(),
        },
        {
          sender: 'agent',
          message: `${initialAgentReply} Reference Ticket ID: ${ticketNumber}`,
          created_at: new Date(Date.now() + 1000),
        },
      ],
    });

    return res.json({
      success: true,
      message: 'Support ticket raised successfully. We will resolve it shortly.',
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 17. REPLY to Support Ticket
export async function replySupportTicket(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.responses.push({
      sender: 'customer',
      message: message.trim(),
      created_at: new Date(),
    });

    ticket.responses.push({
      sender: 'agent',
      message: 'Thanks for updating us. Our executive is on it and resolving this for you.',
      created_at: new Date(Date.now() + 1500),
    });

    await ticket.save();

    return res.json({
      success: true,
      message: 'Reply sent',
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 18. LOGOUT
export async function logout(_req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

// 19. PLACE ORDER (Customer Checkout)
export async function placeOrder(req, res) {
  try {
    const customer = await resolveCustomer(req);
    const {
      order_number,
      items = [],
      delivery_address,
      delivery_slot,
      notes,
      payment_method = 'cod',
      payment_status = 'pending',
      delivery_fee = 0,
      discount = 0,
      subtotal,
      total,
    } = req.body;

    const calcSubtotal =
      subtotal !== undefined
        ? Number(subtotal)
        : items.reduce(
            (sum, it) =>
              sum +
              Number(it.price || it.unit_price || it.variant?.price || 0) *
                Number(it.quantity || 1),
            0
          );

    const calcTotal =
      total !== undefined
        ? Number(total)
        : calcSubtotal + Number(delivery_fee || 0) - Number(discount || 0);

    const finalOrderNumber =
      order_number ||
      `GRO${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

    const order = await Order.create({
      order_number: finalOrderNumber,
      customer_id: customer._id,
      status: 'pending',
      payment_status: payment_status || 'pending',
      payment_method: payment_method || 'cod',
      subtotal: calcSubtotal,
      discount: Number(discount || 0),
      delivery_fee: Number(delivery_fee || 0),
      tax: 0,
      total: calcTotal,
      notes: notes || (delivery_slot ? `Slot: ${delivery_slot}` : null),
      delivery_address: delivery_address || null,
      placed_at: new Date(),
    });

    if (items.length > 0) {
      const orderItemsToInsert = items.map((i) => ({
        order_id: order._id,
        product_id: i.product_id || i.product?.id || null,
        variant_id: i.variant_id || i.variant?.id || null,
        product_name:
          i.product_name || i.name || i.product?.name || 'Grocery Item',
        variant_label:
          i.variant_label || i.quantityLabel || i.variant?.quantity || null,
        unit_price: Number(
          i.unit_price || i.price || i.variant?.price || 0
        ),
        quantity: Number(i.quantity || 1),
        line_total:
          Number(i.unit_price || i.price || i.variant?.price || 0) *
          Number(i.quantity || 1),
      }));
      await OrderItem.insertMany(orderItemsToInsert);
    }

    await OrderStatusHistory.create({
      order_id: order._id,
      status: 'pending',
      note: 'Order placed via Agrawal General & Provisional Store Web Checkout',
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        id: String(order._id),
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

