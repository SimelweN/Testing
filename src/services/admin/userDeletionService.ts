import { supabase } from "@/integrations/supabase/client";
import { logError, logDatabaseError } from "@/utils/errorUtils";

export interface UserDeletionReport {
  userId: string;
  email: string;
  success: boolean;
  deletedRecords: {
    profiles: number;
    books: number;
    orders: number;
    notifications: number;
    transactions: number;
    banking: number;
    other: number;
  };
  errors: string[];
}

export class UserDeletionService {
  /**
   * Complete user deletion - removes all user data from all tables
   */
  static async deleteUserCompletely(userIdOrEmail: string): Promise<UserDeletionReport> {
    const report: UserDeletionReport = {
      userId: '',
      email: '',
      success: false,
      deletedRecords: {
        profiles: 0,
        books: 0,
        orders: 0,
        notifications: 0,
        transactions: 0,
        banking: 0,
        other: 0,
      },
      errors: [],
    };

    try {
      console.log('🗑️ Starting complete user deletion for:', userIdOrEmail);

      // First, find the user by email or ID
      let userProfile: any = null;
      
      if (userIdOrEmail.includes('@')) {
        // Search by email
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('email', userIdOrEmail)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          report.errors.push(`Failed to find user by email: ${error.message}`);
          return report;
        }
        userProfile = data;
      } else {
        // Search by ID
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('id', userIdOrEmail)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          report.errors.push(`Failed to find user by ID: ${error.message}`);
          return report;
        }
        userProfile = data;
      }

      if (!userProfile) {
        report.errors.push('User not found');
        return report;
      }

      report.userId = userProfile.id;
      report.email = userProfile.email;

      console.log('👤 Found user:', {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
      });

      // Delete user data from all tables in correct order (respecting foreign key constraints)
      
      // 1. Delete notifications
      try {
        const { count: notifCount, error: notifError } = await supabase
          .from('notifications')
          .delete({ count: 'exact' })
          .eq('user_id', userProfile.id);
        
        if (notifError) {
          report.errors.push(`Notifications deletion failed: ${notifError.message}`);
        } else {
          report.deletedRecords.notifications = notifCount || 0;
          console.log('✅ Deleted notifications:', notifCount);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.errors.push(`Notifications deletion error: ${errorMessage}`);
      }

      // 2. Delete mail queue entries (skip if table/column doesn't exist)
      try {
        const { count: mailCount, error: mailError } = await supabase
          .from('mail_queue')
          .delete({ count: 'exact' })
          .eq('to_email', userProfile.email);

        if (mailError) {
          if (mailError.code === '42P01' || mailError.message.includes('does not exist')) {
            console.warn('Mail queue table/column does not exist, skipping...');
          } else {
            report.errors.push(`Mail queue deletion failed: ${mailError.message}`);
          }
        } else {
          report.deletedRecords.other += mailCount || 0;
          console.log('✅ Deleted mail queue entries:', mailCount);
        }
      } catch (error) {
        console.warn('Mail queue deletion skipped (table may not exist):', error);
      }

      // 3. Delete contact messages
      try {
        const { count: contactCount, error: contactError } = await supabase
          .from('contact_messages')
          .delete({ count: 'exact' })
          .eq('email', userProfile.email);
        
        if (contactError) {
          report.errors.push(`Contact messages deletion failed: ${contactError.message}`);
        } else {
          report.deletedRecords.other += contactCount || 0;
          console.log('✅ Deleted contact messages:', contactCount);
        }
      } catch (error) {
        console.warn('Contact messages deletion skipped (table may not exist):', error);
      }

      // 4. Delete reports (both filed by user and against user) - handle missing columns
      try {
        const { count: reportCount, error: reportError } = await supabase
          .from('reports')
          .delete({ count: 'exact' })
          .or(`reporter_id.eq.${userProfile.id},reported_user_id.eq.${userProfile.id}`);

        if (reportError) {
          if (reportError.code === '42P01' || reportError.message.includes('does not exist')) {
            console.warn('Reports table/column does not exist, skipping...');
          } else {
            report.errors.push(`Reports deletion failed: ${reportError.message}`);
          }
        } else {
          report.deletedRecords.other += reportCount || 0;
          console.log('✅ Deleted reports:', reportCount);
        }
      } catch (error) {
        console.warn('Reports deletion skipped (table may not exist):', error);
      }

      // 5. Delete transactions and payment data
      try {
        // Payment transactions
        const { count: paymentCount, error: paymentError } = await supabase
          .from('payment_transactions')
          .delete({ count: 'exact' })
          .eq('customer_email', userProfile.email);
        
        if (paymentError) {
          report.errors.push(`Payment transactions deletion failed: ${paymentError.message}`);
        } else {
          report.deletedRecords.transactions += paymentCount || 0;
          console.log('✅ Deleted payment transactions:', paymentCount);
        }

        // Regular transactions
        const { count: transCount, error: transError } = await supabase
          .from('transactions')
          .delete({ count: 'exact' })
          .eq('user_id', userProfile.id);

        if (transError) {
          if (transError.code === '42P01' || transError.message.includes('does not exist')) {
            console.warn('Transactions table/column does not exist, skipping...');
          } else {
            report.errors.push(`Transactions deletion failed: ${transError.message}`);
          }
        } else {
          report.deletedRecords.transactions += transCount || 0;
          console.log('✅ Deleted transactions:', transCount);
        }
      } catch (error) {
        console.warn('Transactions deletion had issues:', error);
      }

      // 6. Delete banking/subaccount data
      try {
        const { count: bankingCount, error: bankingError } = await supabase
          .from('banking_subaccounts')
          .delete({ count: 'exact' })
          .eq('email', userProfile.email);
        
        if (bankingError) {
          report.errors.push(`Banking data deletion failed: ${bankingError.message}`);
        } else {
          report.deletedRecords.banking = bankingCount || 0;
          console.log('✅ Deleted banking data:', bankingCount);
        }
      } catch (error) {
        console.warn('Banking deletion skipped (table may not exist):', error);
      }

      // 7. Delete sale commitments - handle missing columns
      try {
        const { count: commitCount, error: commitError } = await supabase
          .from('sale_commitments')
          .delete({ count: 'exact' })
          .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`);

        if (commitError) {
          if (commitError.code === '42P01' || commitError.message.includes('does not exist')) {
            console.warn('Sale commitments table/column does not exist, skipping...');
          } else {
            report.errors.push(`Sale commitments deletion failed: ${commitError.message}`);
          }
        } else {
          report.deletedRecords.other += commitCount || 0;
          console.log('✅ Deleted sale commitments:', commitCount);
        }
      } catch (error) {
        console.warn('Sale commitments deletion skipped (table may not exist):', error);
      }

      // 8. Delete orders (as buyer)
      try {
        const { count: orderCount, error: orderError } = await supabase
          .from('orders')
          .delete({ count: 'exact' })
          .eq('buyer_email', userProfile.email);
        
        if (orderError) {
          report.errors.push(`Orders deletion failed: ${orderError.message}`);
        } else {
          report.deletedRecords.orders = orderCount || 0;
          console.log('✅ Deleted orders:', orderCount);
        }
      } catch (error) {
        console.warn('Orders deletion had issues:', error);
      }

      // 9. Delete books (user's listings)
      try {
        const { count: bookCount, error: bookError } = await supabase
          .from('books')
          .delete({ count: 'exact' })
          .eq('seller_id', userProfile.id);
        
        if (bookError) {
          report.errors.push(`Books deletion failed: ${bookError.message}`);
        } else {
          report.deletedRecords.books = bookCount || 0;
          console.log('✅ Deleted books:', bookCount);
        }
      } catch (error) {
        console.warn('Books deletion had issues:', error);
      }

      // 10. Finally, delete the profile (this might cascade delete auth user)
      try {
        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .delete({ count: 'exact' })
          .eq('id', userProfile.id);
        
        if (profileError) {
          report.errors.push(`Profile deletion failed: ${profileError.message}`);
        } else {
          report.deletedRecords.profiles = profileCount || 0;
          console.log('✅ Deleted profile:', profileCount);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.errors.push(`Profile deletion error: ${errorMessage}`);
      }

      // 11. Try to delete from Supabase Auth (if accessible)
      try {
        // Note: This requires admin privileges and may not work from client-side
        // In production, this should be done via a secure admin endpoint
        console.log('ℹ️ Note: Supabase Auth user deletion requires admin privileges');
        console.log('ℹ️ The auth user may need to be deleted manually from Supabase dashboard');
      } catch (error) {
        console.warn('Auth user deletion not possible from client:', error);
      }

      // Calculate success - don't count missing table warnings as errors
      const totalDeleted = Object.values(report.deletedRecords).reduce((sum, count) => sum + count, 0);
      const realErrors = report.errors.filter(error =>
        !error.includes('does not exist') &&
        !error.includes('table may not exist')
      );
      report.success = totalDeleted > 0 && realErrors.length === 0;

      console.log('🎯 User deletion completed:', {
        success: report.success,
        totalRecords: totalDeleted,
        errors: report.errors.length,
      });

      return report;
    } catch (error) {
      logError('Complete user deletion failed', error);
      report.errors.push(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
      return report;
    }
  }

  /**
   * Search for all data related to a user (by email or ID) without deleting
   */
  static async searchUserData(userIdOrEmail: string): Promise<{
    found: boolean;
    userId?: string;
    email?: string;
    name?: string;
    dataFound: {
      profiles: number;
      books: number;
      orders: number;
      notifications: number;
      transactions: number;
      banking: number;
      other: number;
    };
    errors: string[];
  }> {
    const result = {
      found: false,
      dataFound: {
        profiles: 0,
        books: 0,
        orders: 0,
        notifications: 0,
        transactions: 0,
        banking: 0,
        other: 0,
      },
      errors: [] as string[],
    };

    try {
      // Find user profile
      let userProfile: any = null;
      
      if (userIdOrEmail.includes('@')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('email', userIdOrEmail)
          .single();
        
        if (!error) {
          userProfile = data;
        }
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('id', userIdOrEmail)
          .single();
        
        if (!error) {
          userProfile = data;
        }
      }

      if (!userProfile) {
        return { ...result, errors: ['User not found'] };
      }

      result.found = true;
      (result as any).userId = userProfile.id;
      (result as any).email = userProfile.email;
      (result as any).name = userProfile.name;

      // Count records in each table
      const tables = [
        { name: 'profiles', field: 'id', value: userProfile.id, key: 'profiles' },
        { name: 'books', field: 'seller_id', value: userProfile.id, key: 'books' },
        { name: 'orders', field: 'buyer_email', value: userProfile.email, key: 'orders' },
        { name: 'notifications', field: 'user_id', value: userProfile.id, key: 'notifications' },
        { name: 'transactions', field: 'user_id', value: userProfile.id, key: 'transactions' },
        { name: 'payment_transactions', field: 'customer_email', value: userProfile.email, key: 'transactions' },
        { name: 'banking_subaccounts', field: 'email', value: userProfile.email, key: 'banking' },
      ];

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq(table.field, table.value);

          if (!error) {
            result.dataFound[table.key as keyof typeof result.dataFound] += count || 0;
          }
        } catch (error) {
          console.warn(`Skipped counting ${table.name}:`, error);
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Search error: ${errorMessage}`);
      return result;
    }
  }
}
