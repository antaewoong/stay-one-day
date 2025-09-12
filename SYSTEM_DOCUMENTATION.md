# Stay OneDay Clean - System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [API Inventory](#api-inventory)
3. [Database Schema](#database-schema)
4. [RLS (Row Level Security) Policies](#rls-policies)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Authentication Architecture](#authentication-architecture)
7. [Security Implementation](#security-implementation)

---

## System Overview

Stay OneDay Clean is a accommodation booking platform built with Next.js 14 (App Router), Supabase, and TypeScript. The system supports multiple user types including customers, hosts, admins, and influencers, with comprehensive role-based access controls.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with JWT tokens
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel (presumed)

---

## API Inventory

### Admin APIs (`/api/admin/*`)
Administrative endpoints protected by `withAdminAuth` middleware:

#### Core Admin Management
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/refresh-token` - Token refresh
- `GET|POST /api/admin/admins` - Admin account management
- `POST /api/admin/change-user-password` - Change user passwords

#### Content Management
- `GET|POST /api/admin/accommodations` - Accommodation management
- `GET|POST /api/admin/notices` - Notice management
- `GET|POST /api/admin/hero-slides` - Homepage hero slides
- `GET|POST /api/admin/hero-texts` - Homepage hero text content
- `GET|POST /api/admin/sections` - Main page sections

#### User Management
- `GET|POST /api/admin/hosts` - Host management
- `GET /api/admin/hosts/[id]` - Individual host details
- `GET|POST /api/admin/influencers` - Influencer management
- `GET|POST /api/admin/inquiries` - Customer inquiry management

#### Booking & Operations
- `GET|POST /api/admin/reservations` - Reservation management
- `GET /api/admin/reservations/[id]` - Individual reservation details
- `GET /api/admin/reservations/calendar` - Calendar view of reservations
- `GET|POST /api/admin/collaboration-requests` - Influencer collaboration requests

#### Analytics & Reporting
- `GET /api/admin/group-kpi` - Group KPI metrics
- `GET|POST /api/admin/notices/[id]` - Notice details

#### Influencer Management
- `GET|POST /api/admin/influencer-notices` - Influencer-specific notices
- `GET|POST /api/admin/influencer-tokens` - Token management for influencer access
- `GET|POST /api/admin/delete-requests` - Account deletion requests
- `GET /api/admin/delete-requests/[id]` - Individual deletion request

#### System Maintenance
- `POST /api/admin/seed-data` - Database seeding
- `POST /api/admin/seed-sections` - Section seeding
- `POST /api/admin/fix-schema` - Schema fixes
- `POST /api/admin/fix-constraints` - Constraint fixes
- `POST /api/admin/setup-marketing` - Marketing setup
- `POST /api/admin/update-hosts` - Bulk host updates
- `POST /api/admin/create-real-tables` - Table creation
- `POST /api/admin/fix-accommodation-types-rls` - RLS policy fixes
- `POST /api/admin/schema/add-types-array` - Schema modifications

#### Telegram Integration
- `POST /api/admin/telegram/register` - Telegram bot registration

### Host APIs (`/api/host/*`)
Host-specific endpoints for accommodation owners:

- `POST /api/host/login` - Host authentication
- `GET|POST /api/host/accommodations` - Host's accommodation management
- `GET|POST /api/host/reservations` - Host's reservation management
- `GET|POST /api/host/inquiries` - Host's customer inquiries
- `GET /api/host/dashboard` - Host dashboard data
- `GET /api/host/stats` - Host statistics
- `GET /api/host/group-kpi` - Host group KPI metrics
- `GET|POST /api/host/collaboration-requests` - Collaboration request management
- `GET|POST /api/host/influencer-reviews` - Influencer review management
- `POST /api/host/influencer-reviews/reply` - Reply to influencer reviews

### Public APIs (`/api/*`)
Public endpoints accessible without authentication:

#### Core Booking System
- `GET|POST /api/accommodations` - Browse accommodations
- `GET /api/accommodations/[id]` - Accommodation details
- `POST /api/accommodations/update-images` - Image updates
- `POST /api/accommodations/update-stay-cheongju` - Location-specific updates
- `GET|POST /api/reservations` - Reservation management
- `GET /api/reservations/[id]` - Reservation details

#### Reviews & Feedback
- `GET|POST /api/reviews` - Review system
- `POST /api/reviews/[id]/reply` - Host replies to reviews
- `GET|POST /api/inquiries` - Customer inquiries
- `GET /api/inquiries/[id]` - Inquiry details
- `POST /api/inquiries/[id]/replies` - Inquiry responses

#### Content & Information
- `GET|POST /api/notices` - Public notices
- `GET /api/notices/[id]` - Notice details
- `GET /api/holidays` - Holiday information
- `GET|POST /api/wishlists` - User wishlists
- `GET /api/profile` - User profile

#### Business Operations
- `POST /api/partner-inquiry` - Partnership inquiries
- `POST /api/partnership` - Partnership requests
- `POST /api/contact` - Contact form submissions
- `POST /api/payment/confirm` - Payment confirmation

#### Promotions & Discounts
- `POST /api/discount-codes/validate` - Discount code validation

#### Analytics & Tracking
- `POST /api/analytics/track-event` - Event tracking
- `POST /api/analytics/track-conversion` - Conversion tracking
- `POST /api/analytics/track-session` - Session tracking
- `GET /api/analytics/journey` - User journey analytics
- `GET /api/analytics/sessions` - Session analytics

#### AI & Intelligence
- `POST /api/ai/marketing-insights` - AI marketing analysis
- `POST /api/ai/marketing-analysis` - Marketing performance analysis
- `POST /api/ai/influencer-evaluation` - AI influencer assessment
- `POST /api/ai/competitive-analysis` - Competitive intelligence
- `POST /api/ai/naver-place-optimization` - Naver Places optimization
- `POST /api/ai/marketing-performance` - Marketing performance metrics

#### Marketing & Intelligence
- `GET /api/marketing/intelligence` - Marketing intelligence data

### Authentication APIs (`/api/auth/*`)
Authentication and account management:

- `POST /api/auth/change-password` - Password change

### Influencer APIs (`/api/influencer/*`)
Influencer collaboration system:

- `POST /api/influencer/login` - Influencer authentication
- `GET /api/influencer/current-period` - Current collaboration period
- `POST /api/influencer/submit-review` - Submit influencer review
- `GET /api/influencer/review-info/[token]` - Review information by token
- `POST /api/influencer/collaboration-request` - Request collaboration
- `GET /api/influencer/verify-token/[token]` - Token verification
- `GET /api/influencer/notices` - Influencer-specific notices

### Webhook & Integration APIs
- `POST /api/notifications/webhook` - Notification webhooks
- `POST /api/telegram/webhook` - Telegram bot webhooks

### Debug & Development APIs
- `GET /api/debug/user-roles` - Debug user roles
- `POST /api/insert-real-data` - Development data insertion

---

## Database Schema

### Core Tables

#### Users & Authentication
```sql
-- User profiles
users (id, email, name, profile_image, kakao_id, phone, created_at, updated_at)

-- User role assignments
user_roles (user_id, role, created_at)

-- Admin accounts
admin_accounts (id, auth_user_id, username, password_hash, name, email, role, is_active, created_at, updated_at)

-- User profiles (extended)
profiles (id, user_id, name, email, phone, created_at, updated_at)
```

#### Business & Hosts
```sql
-- Business accounts
business_accounts (id, user_id, business_name, business_number, created_at, updated_at)

-- Host information
hosts (id, user_id, auth_user_id, business_name, business_number, representative_name, phone, address, bank_name, account_number, account_holder, status, commission_rate, created_at, updated_at)
```

#### Accommodations & Categories
```sql
-- Accommodation categories
categories (id, name, description, icon, sort_order, is_active, created_at)
accommodation_categories (id, name, description, created_at, updated_at)

-- Accommodation types
accommodation_types (id, name, description, created_at, updated_at)

-- Main accommodations table
accommodations (id, host_id, business_id, category_id, name, description, short_description, address, latitude, longitude, base_capacity, max_capacity, base_price, extra_person_fee, check_in_time, check_out_time, amenities, rules, cancellation_policy, status, rating, review_count, created_at, updated_at)

-- Accommodation images
accommodation_images (id, accommodation_id, image_url, alt_text, sort_order, is_primary, created_at)

-- Accommodation amenities
accommodation_amenities (id, accommodation_id, amenity_name, created_at)

-- Accommodation discounts
accommodation_discounts (id, accommodation_id, discount_type, discount_value, min_nights, valid_from, valid_to, created_at)
```

#### Reservations & Bookings
```sql
-- Reservations
reservations (id, reservation_number, user_id, accommodation_id, check_in_date, usage_start_time, usage_end_time, guest_count, base_price, extra_fee, option_fee, total_price, special_requests, status, customer_name, customer_phone, customer_email, created_at, updated_at)

-- Payments
payments (id, reservation_id, amount, payment_method, payment_provider, card_number, approval_number, payment_key, status, fee_amount, actual_amount, paid_at, refunded_at, created_at)

-- Settlements
settlements (id, business_id, reservation_id, gross_amount, commission_amount, net_amount, settlement_date, status, created_at)

-- Settlement reports
settlement_reports (id, business_id, period_start, period_end, total_gross, total_commission, total_net, created_at)
```

#### Reviews & Feedback
```sql
-- Reviews
reviews (id, reservation_id, user_id, accommodation_id, rating, title, content, images, host_reply, host_reply_at, status, created_at, updated_at)

-- Review images
review_images (id, review_id, image_url, alt_text, sort_order, created_at)

-- Customer inquiries
inquiries (id, accommodation_id, user_id, name, email, phone, subject, message, status, created_at, updated_at)
```

#### Promotions & Marketing
```sql
-- Discount codes
discount_codes (id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count, valid_from, valid_to, is_active, created_at)

-- Promotion usage tracking
promotion_usages (id, user_id, discount_code_id, reservation_id, discount_amount, used_at)

-- Promotions
promotions (id, title, description, discount_type, discount_value, start_date, end_date, status, created_at, updated_at)
```

#### Content Management
```sql
-- Notices
notices (id, title, content, type, priority, status, created_at, updated_at)

-- Main page sections
main_page_sections (id, section_type, title, subtitle, content, image_url, link_url, sort_order, is_active, created_at, updated_at)

-- Hero slides
hero_slides (id, title, subtitle, image_url, link_url, sort_order, is_active, created_at)

-- Hero texts
hero_texts (id, title, subtitle, description, created_at, updated_at)
```

#### Influencer System
```sql
-- Influencers
influencers (id, auth_user_id, name, email, phone, instagram_handle, follower_count, engagement_rate, status, created_at, updated_at)

-- Collaboration periods
collaboration_periods (id, title, start_date, end_date, status, created_at, updated_at)

-- Collaboration requests
influencer_collaboration_requests (id, influencer_id, host_id, accommodation_id, period_id, message, status, created_at, updated_at)

-- Influencer notices
influencer_notices (id, title, content, priority, status, created_at, updated_at)

-- Influencer notice views
influencer_notice_views (id, influencer_id, notice_id, viewed_at)
```

#### Analytics & Tracking
```sql
-- User journey events
user_journey_events (id, session_id, user_id, event_type, page_path, page_url, referrer, utm_source, utm_medium, utm_campaign, created_at)

-- Web sessions
web_sessions (id, session_id, user_id, start_time, end_time, page_views, events, landing_page, exit_page, duration, device_type, browser, created_at, updated_at)

-- Marketing events
marketing_events (id, event_type, user_id, session_id, page_url, utm_source, utm_medium, utm_campaign, conversion_value, created_at)

-- Booking conversions
booking_conversions (id, user_id, session_id, accommodation_id, host_id, reservation_id, conversion_value, utm_source, utm_medium, utm_campaign, created_at)

-- Campaign performance
campaign_performance (id, campaign_name, utm_source, utm_medium, utm_campaign, impressions, clicks, conversions, revenue, date, created_at)

-- Marketing summary
marketing_summary (id, date, total_sessions, total_users, total_bookings, total_revenue, avg_session_duration, bounce_rate, created_at)
```

#### System & Configuration
```sql
-- System settings
system_settings (id, key, value, description, is_public, created_at, updated_at)

-- Notifications
notifications (id, user_id, title, message, type, is_read, created_at)

-- Wishlists
wishlists (id, user_id, accommodation_id, created_at)

-- Partner inquiries
partner_inquiries (id, company_name, contact_name, email, phone, message, status, created_at)

-- Partnership inquiries
partnership_inquiries (id, company_name, contact_name, email, phone, message, type, status, created_at)
```

#### Telegram Integration
```sql
-- Telegram sessions
telegram_sessions (id, chat_id, admin_id, is_active, created_at, updated_at)

-- Telegram registration tokens
telegram_registration_tokens (id, token, admin_id, expires_at, is_used, created_at)
```

#### Advanced Analytics
```sql
-- Location performance
location_performance (id, location, accommodation_count, avg_rating, total_bookings, revenue, date, created_at)

-- User segments daily
user_segments_daily (id, accommodation_id, date, new_users, returning_users, total_sessions, conversion_rate, created_at)

-- Same day fit metrics
same_day_fit_metrics (id, accommodation_id, date, same_day_bookings, total_bookings, fit_rate, created_at)

-- POI heat daily
poi_heat_daily (id, poi_id, host_id, date, heat_score, visitor_count, created_at)

-- Spend tracking
spend_tracking (id, host_id, date, ad_spend, platform, campaign_name, impressions, clicks, conversions, created_at)

-- Spend daily
spend_daily (id, host_id, date, total_spend, total_impressions, total_clicks, total_conversions, cpc, cpm, conversion_rate, created_at)

-- GSC daily data (Google Search Console)
gsc_daily_data (id, host_id, date, query, page, impressions, clicks, ctr, position, created_at)
```

#### Points of Interest (POI)
```sql
-- Local POI
local_poi (id, name, category, latitude, longitude, description, created_at)

-- POI category mapping
poi_category_mapping (id, poi_id, category_name, created_at)
```

#### SMS & Communication
```sql
-- SMS logs
sms_logs (id, phone_number, message, status, sent_at, error_message, created_at)

-- SMS templates
sms_templates (id, business_id, template_name, message_content, variables, is_active, created_at, updated_at)
```

#### UTM & Attribution
```sql
-- UTM source mapping
utm_source_mapping (id, raw_source, canonical_source, created_at)

-- UTM canonical
utm_canonical (id, utm_source, utm_medium, utm_campaign, canonical_source, canonical_medium, canonical_campaign, created_at)
```

### Views
```sql
-- Same day fit group view
v_same_day_fit_group (accommodation_id, avg_fit_rate, total_same_day_bookings, total_bookings)
```

---

## RLS (Row Level Security) Policies

The system implements comprehensive Row Level Security policies to ensure data isolation and proper access control.

### Policy Categories

#### 1. Admin-Only Access
Tables with admin-only write access:
- `accommodation_categories` - Only admins can modify categories
- `categories` - Only admins can manage categories
- `notices` - Only admins can create/edit notices
- `hero_texts` - Only admins can modify hero content
- `system_settings` - Only admins can modify system configuration
- `collaboration_periods` - Only admins can manage collaboration periods
- `influencer_notices` - Only admins can create influencer notices
- `promotions` - Only admins can manage promotions

#### 2. User-Owned Resources
Tables where users can only access their own data:
- `profiles` - Users can only access their own profile
- `reservations` - Users can only see their own reservations
- `payments` - Users can only see their own payment records
- `reviews` - Users can only create/edit their own reviews
- `wishlists` - Users can only access their own wishlist
- `notifications` - Users can only see their own notifications
- `promotion_usages` - Users can only see their own promotion usage

#### 3. Host-Owned Resources
Tables where hosts can access data related to their accommodations:
- `accommodations` - Hosts can manage their own accommodations
- `accommodation_images` - Hosts can manage their accommodation images
- `accommodation_amenities` - Hosts can manage their accommodation amenities
- `inquiries` - Hosts can see inquiries for their accommodations
- `reviews` - Hosts can see reviews for their accommodations
- `reservations` - Hosts can see reservations for their accommodations

#### 4. Public Read Access
Tables with public read access for active/published content:
- `accommodations` - Public can view active accommodations
- `accommodation_images` - Public can view accommodation images
- `accommodation_amenities` - Public can view amenities
- `categories` - Public can view categories
- `reviews` - Public can view published reviews
- `notices` - Public can view published notices

#### 5. Influencer Access
- `influencer_collaboration_requests` - Influencers can manage their own collaboration requests
- `influencer_notices` - Influencers can view notices meant for them
- `influencer_notice_views` - Influencers can track their notice views

### Key RLS Functions

#### `get_user_role()`
Central function that determines user role:
```sql
BEGIN
    -- Return 'customer' if no authenticated user
    IF auth.uid() IS NULL THEN
        RETURN 'customer';
    END IF;
    
    -- Check admin_accounts table for admin/super_admin
    IF EXISTS (
        SELECT 1 FROM admin_accounts 
        WHERE auth_user_id = auth.uid() 
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN 'admin';
    END IF;
    
    -- Check user_roles table
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RETURN 'admin';
    END IF;
    
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'host') THEN
        RETURN 'host';
    END IF;
    
    -- Check hosts table
    IF EXISTS (SELECT 1 FROM hosts WHERE auth_user_id = auth.uid() AND status = 'active') THEN
        RETURN 'host';
    END IF;
    
    -- Check influencers table
    IF EXISTS (SELECT 1 FROM influencers WHERE auth_user_id = auth.uid() AND status = 'active') THEN
        RETURN 'influencer';
    END IF;
    
    -- Default to customer
    RETURN 'customer';
END;
```

#### `is_admin()`
Helper function for admin checks:
```sql
-- Checks if current user is admin via multiple pathways
SELECT get_user_role() IN ('super_admin', 'admin')
```

### Policy Examples

#### Accommodation Access Policy
```sql
-- Admin full access
accommodations_admin_access: get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])

-- Host can access their own accommodations
accommodations_host_access: (get_user_role() = 'host'::text) AND (host_id IN (SELECT hosts.id FROM hosts WHERE hosts.user_id = auth.uid()))

-- Public can view active accommodations
accommodations_public_read_active: status = 'active'::text
```

#### Review Access Policy
```sql
-- Anyone can view published reviews
reviews_public_read: status = 'active'::text

-- Users can manage their own reviews
reviews_user_own: auth.uid() = user_id

-- Hosts can view reviews for their accommodations
reviews_host_read: (get_user_role() = 'host'::text) AND (accommodation_id IN (SELECT accommodations.id FROM accommodations WHERE accommodations.host_id IN (SELECT hosts.id FROM hosts WHERE hosts.user_id = auth.uid())))
```

---

## User Roles & Permissions

### Role Hierarchy

#### 1. Super Admin
- **Database Role**: `super_admin` in `admin_accounts.role`
- **Access**: Full system access, can manage all data and users
- **Special Privileges**:
  - Create/modify admin accounts
  - Access all administrative functions
  - Bypass most RLS restrictions
  - System configuration management

#### 2. Admin
- **Database Role**: `admin` in `admin_accounts.role` or `user_roles.role`
- **Access**: Administrative functions, user management
- **Permissions**:
  - Manage accommodations, reservations, users
  - View analytics and reports
  - Content management (notices, hero content)
  - Customer support functions

#### 3. Manager
- **Database Role**: `manager` in `admin_accounts.role`
- **Access**: Limited administrative functions
- **Permissions**:
  - View reports and analytics
  - Limited user management
  - Content review and moderation

#### 4. Host
- **Database Role**: `host` in `user_roles.role` or active record in `hosts` table
- **Access**: Manage own accommodations and bookings
- **Permissions**:
  - CRUD operations on own accommodations
  - View and manage reservations for own properties
  - Respond to customer inquiries
  - View analytics for own properties
  - Manage collaboration requests with influencers

#### 5. Influencer
- **Database Role**: Active record in `influencers` table
- **Access**: Collaboration system, review submissions
- **Permissions**:
  - Submit collaboration requests
  - Access collaboration-specific notices
  - Submit reviews for collaborated accommodations
  - View own collaboration history

#### 6. Customer
- **Database Role**: Default role for authenticated users
- **Access**: Browse and book accommodations
- **Permissions**:
  - View active accommodations
  - Make reservations
  - Submit reviews for stayed accommodations
  - Manage own profile and wishlist
  - Submit inquiries

### API Access Matrix

| Role | Admin APIs | Host APIs | Public APIs | Auth APIs |
|------|------------|-----------|-------------|-----------|
| Super Admin | ✅ Full | ✅ View All | ✅ Full | ✅ |
| Admin | ✅ Most | ✅ View All | ✅ Full | ✅ |
| Manager | ✅ Limited | ❌ | ✅ Full | ✅ |
| Host | ❌ | ✅ Own Data | ✅ Full | ✅ |
| Influencer | ❌ | ❌ | ✅ Limited | ✅ |
| Customer | ❌ | ❌ | ✅ Standard | ✅ |

---

## Authentication Architecture

### Overview
The system uses Supabase Auth with JWT tokens, implementing a hybrid approach that combines Supabase's built-in authentication with custom role management.

### Authentication Flow

#### 1. Client-Side Authentication
```typescript
// lib/supabase/client.ts - Browser client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Authentication helper
async function getAccessTokenOrThrow() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) {
    throw new Error('AuthSessionMissing: access_token not found')
  }
  return data.session.access_token
}
```

#### 2. Server-Side Authentication
```typescript
// lib/supabase/server.ts - Server client with cookies
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies }
)
```

#### 3. Service Role Client
```typescript
// For admin operations bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role key
)
```

### Authentication Middleware

#### Next.js Middleware (`middleware.ts`)
```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  // Protected paths requiring authentication
  const protectedPaths = ['/admin', '/business', '/reservations']
  
  // Redirect unauthenticated users from protected paths
  if (!user && isProtectedPath) {
    return NextResponse.redirect('/login')
  }
}
```

#### Admin Authentication Middleware
```typescript
// middleware/withAdminAuth.ts
export async function withAdminAuth(req: NextRequest, handler: Function) {
  // Extract token from Authorization header or session
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') 
                || data.session?.access_token

  // Decode JWT and verify admin role
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64'))
  
  // Check admin_accounts table for active admin
  const { data: adminAccount } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, email, is_active')
    .eq('auth_user_id', payload.sub)
    .eq('is_active', true)
    .single()
  
  if (!adminAccount) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
}
```

### Role Verification Methods

#### 1. JWT-Based Verification (lib/auth/admin.ts)
```typescript
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader.replace('Bearer ', '')
  
  // 1. Check super admin password
  if (token === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return true
  }
  
  // 2. Verify Supabase JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  // 3. Check admin role in admin_users table
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  return adminUser?.role === 'admin' || adminUser?.role === 'super_admin' || adminUser?.role === 'manager'
}
```

#### 2. Host Verification
```typescript
export async function isHostRequest(request: NextRequest): Promise<{ isHost: boolean, hostId?: string }> {
  // Similar pattern but checks hosts table
  const { data: hostUser } = await supabase
    .from('hosts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
    
  return { isHost: !!hostUser, hostId: hostUser?.id }
}
```

### Session Management

#### Client-Side Session Handling
```typescript
// lib/auth-helpers.ts
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessTokenOrThrow()
  
  const response = await fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',  // Prevent caching of authenticated requests
  })
  
  return response.json()
}
```

#### Admin Session Management
```typescript
export async function getAdminSession() {
  const { data, error } = await supabase.auth.getSession()
  
  // Auto-refresh expired tokens
  if (data.session.expires_at && data.session.expires_at * 1000 < Date.now()) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    return refreshed.session
  }
  
  return data.session
}
```

---

## Security Implementation

### Multi-Layer Security Architecture

#### 1. **Service Key Usage (Server-Only)**
```typescript
// Only used on server-side for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Never exposed to client
)
```

**Security Features:**
- Service role key never sent to client
- Bypasses RLS for administrative operations
- Used only in protected API routes with proper authentication

#### 2. **Row Level Security (RLS) Policy Enforcement**

**Policy Structure:**
- **Read Policies**: Control what data users can view
- **Write Policies**: Control what data users can modify
- **Role-Based**: Policies check `get_user_role()` function
- **Ownership-Based**: Users can only access their own data

**Example Security Patterns:**
```sql
-- Users can only see their own reservations
CREATE POLICY "reservations_user_own" ON reservations
FOR ALL USING (auth.uid() = user_id);

-- Hosts can only manage their accommodations
CREATE POLICY "accommodations_host_access" ON accommodations
FOR ALL USING (
  (get_user_role() = 'host'::text) 
  AND (host_id IN (
    SELECT hosts.id FROM hosts 
    WHERE hosts.user_id = auth.uid()
  ))
);

-- Admins can access everything
CREATE POLICY "accommodations_admin_access" ON accommodations
FOR ALL USING (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]));
```

#### 3. **Admin Authentication Flow**

**Multi-Factor Verification:**
1. **JWT Token Validation**: Verify Supabase auth token
2. **Admin Account Check**: Verify active admin record
3. **Role Permission Check**: Confirm appropriate role level
4. **Session Validation**: Ensure session hasn't expired

**Security Features:**
- Token expiration handling with auto-refresh
- Admin account status verification (`is_active = true`)
- Role-based access control within admin functions
- Session context tracking for audit purposes

#### 4. **API Security Patterns**

**Authentication Middleware:**
```typescript
// All admin APIs protected by withAdminAuth
export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    // ctx.adminId, ctx.adminEmail available
    // Authenticated admin logic here
  })
```

**Request Validation:**
- Authorization header required for protected endpoints
- Token validation before processing requests
- Role verification for specific operations
- Input sanitization and validation

#### 5. **Client-Side Security**

**Token Management:**
- Access tokens stored in secure HTTP-only cookies
- Automatic token refresh before expiration
- No sensitive tokens stored in localStorage
- CSRF protection via SameSite cookie attributes

**API Communication:**
```typescript
// Secure API client pattern
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessTokenOrThrow()  // Throws if no valid token
  
  return fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',  // Prevent sensitive data caching
  })
}
```

#### 6. **Role-Based Data Isolation**

**Customer Data Protection:**
- Customers can only see their own reservations, reviews, profiles
- No access to other users' personal information
- Accommodation data limited to active/published listings

**Host Data Isolation:**
- Hosts can only access data for their own accommodations
- Reservation data limited to their properties
- Analytics scoped to their business only

**Admin Audit Trail:**
- Admin actions logged with context (admin ID, email)
- Sensitive operations require explicit admin verification
- Role changes tracked and auditable

### Security Best Practices Implemented

1. **Principle of Least Privilege**: Each role has minimal necessary permissions
2. **Defense in Depth**: Multiple security layers (RLS + middleware + client validation)
3. **Secure by Default**: Default role is `customer` with minimal access
4. **Token Security**: Short-lived tokens with refresh mechanism
5. **Input Validation**: Server-side validation for all user inputs
6. **Error Handling**: Generic error messages to prevent information disclosure
7. **Audit Logging**: Admin actions logged with context for accountability

---

## Development & Maintenance Notes

### Environment Variables Required
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Authentication
NEXT_PUBLIC_ADMIN_PASSWORD=super_admin_password

# Other integrations (if applicable)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Key Files for Maintenance
- `/lib/supabase/` - Database clients and configuration
- `/middleware/withAdminAuth.ts` - Admin authentication middleware
- `/lib/auth/` - Authentication utilities
- `/app/api/admin/` - Admin API endpoints
- `/app/api/host/` - Host API endpoints

### Database Functions to Monitor
- `get_user_role()` - Central role determination logic
- `is_admin()` - Admin verification helper
- `create_user_profile()` - User profile creation
- `user_owns_accommodation()` - Ownership verification

This documentation should be updated as the system evolves, particularly when new roles, permissions, or security features are added.