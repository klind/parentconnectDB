const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllRecommendations() {
  try {
    console.log('🔄 Starting to delete all recommendation-related data...');
    console.log('');
    
    let totalDeleted = 0;
    let totalErrors = 0;
    
    // 1. Delete posts with "recommendations" tag
    console.log('📝 Checking posts with "recommendations" tag...');
    try {
      const postsSnapshot = await db.collection('posts')
        .where('tags', 'array-contains', 'recommendations')
        .get();
      
      if (postsSnapshot.empty) {
        console.log('   ✅ No posts with "recommendations" tag found.');
      } else {
        console.log(`   📋 Found ${postsSnapshot.docs.length} posts with "recommendations" tag...`);
        
        const deletePromises = postsSnapshot.docs.map(async (doc) => {
          try {
            await doc.ref.delete();
            console.log(`   ✅ Deleted post: ${doc.data().title || doc.id}`);
            return { success: true, type: 'post', id: doc.id };
          } catch (error) {
            console.error(`   ❌ Error deleting post ${doc.id}:`, error.message);
            return { success: false, type: 'post', id: doc.id, error: error.message };
          }
        });
        
        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        totalDeleted += successful;
        totalErrors += failed;
        
        console.log(`   📊 Posts: ${successful} deleted, ${failed} failed`);
      }
    } catch (error) {
      console.error('   ❌ Error querying posts:', error.message);
      totalErrors++;
    }
    
    console.log('');
    
    // 2. Delete posts with titles containing "recommendation"
    console.log('📝 Checking posts with "recommendation" in title...');
    try {
      const allPostsSnapshot = await db.collection('posts').get();
      const recommendationPosts = allPostsSnapshot.docs.filter(doc => {
        const title = doc.data().title || '';
        return title.toLowerCase().includes('recommendation');
      });
      
      if (recommendationPosts.length === 0) {
        console.log('   ✅ No posts with "recommendation" in title found.');
      } else {
        console.log(`   📋 Found ${recommendationPosts.length} posts with "recommendation" in title...`);
        
        const deletePromises = recommendationPosts.map(async (doc) => {
          try {
            await doc.ref.delete();
            console.log(`   ✅ Deleted post: ${doc.data().title || doc.id}`);
            return { success: true, type: 'post', id: doc.id };
          } catch (error) {
            console.error(`   ❌ Error deleting post ${doc.id}:`, error.message);
            return { success: false, type: 'post', id: doc.id, error: error.message };
          }
        });
        
        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        totalDeleted += successful;
        totalErrors += failed;
        
        console.log(`   📊 Posts: ${successful} deleted, ${failed} failed`);
      }
    } catch (error) {
      console.error('   ❌ Error querying posts by title:', error.message);
      totalErrors++;
    }
    
    console.log('');
    
    // 3. Delete posts with descriptions containing "recommendation"
    console.log('📝 Checking posts with "recommendation" in description...');
    try {
      const allPostsSnapshot = await db.collection('posts').get();
      const recommendationPosts = allPostsSnapshot.docs.filter(doc => {
        const description = doc.data().description || '';
        return description.toLowerCase().includes('recommendation');
      });
      
      if (recommendationPosts.length === 0) {
        console.log('   ✅ No posts with "recommendation" in description found.');
      } else {
        console.log(`   📋 Found ${recommendationPosts.length} posts with "recommendation" in description...`);
        
        const deletePromises = recommendationPosts.map(async (doc) => {
          try {
            await doc.ref.delete();
            console.log(`   ✅ Deleted post: ${doc.data().title || doc.id}`);
            return { success: true, type: 'post', id: doc.id };
          } catch (error) {
            console.error(`   ❌ Error deleting post ${doc.id}:`, error.message);
            return { success: false, type: 'post', id: doc.id, error: error.message };
          }
        });
        
        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        totalDeleted += successful;
        totalErrors += failed;
        
        console.log(`   📊 Posts: ${successful} deleted, ${failed} failed`);
      }
    } catch (error) {
      console.error('   ❌ Error querying posts by description:', error.message);
      totalErrors++;
    }
    
    console.log('');
    
    // 4. Check if there's a dedicated recommendations collection
    console.log('📁 Checking for dedicated recommendations collection...');
    try {
      const recommendationsSnapshot = await db.collection('recommendations').get();
      
      if (recommendationsSnapshot.empty) {
        console.log('   ✅ No dedicated recommendations collection found.');
      } else {
        console.log(`   📋 Found ${recommendationsSnapshot.docs.length} items in recommendations collection...`);
        
        const deletePromises = recommendationsSnapshot.docs.map(async (doc) => {
          try {
            await doc.ref.delete();
            console.log(`   ✅ Deleted recommendation: ${doc.data().name || doc.id}`);
            return { success: true, type: 'recommendation', id: doc.id };
          } catch (error) {
            console.error(`   ❌ Error deleting recommendation ${doc.id}:`, error.message);
            return { success: false, type: 'recommendation', id: doc.id, error: error.message };
          }
        });
        
        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        totalDeleted += successful;
        totalErrors += failed;
        
        console.log(`   📊 Recommendations: ${successful} deleted, ${failed} failed`);
      }
    } catch (error) {
      console.error('   ❌ Error querying recommendations collection:', error.message);
      totalErrors++;
    }
    
    console.log('');
    
    // 5. Check for user preferences related to recommendations
    console.log('👤 Checking user preferences for recommendation settings...');
    try {
      const usersSnapshot = await db.collection('users').get();
      let usersUpdated = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        let needsUpdate = false;
        const updatedData = { ...userData };
        
        // Check for activityRecommendations preference
        if (userData.preferences && userData.preferences.activityRecommendations !== undefined) {
          delete updatedData.preferences.activityRecommendations;
          needsUpdate = true;
        }
        
        // Check for any other recommendation-related preferences
        if (userData.preferences) {
          const prefKeys = Object.keys(userData.preferences);
          const recommendationKeys = prefKeys.filter(key => 
            key.toLowerCase().includes('recommendation')
          );
          
          if (recommendationKeys.length > 0) {
            recommendationKeys.forEach(key => {
              delete updatedData.preferences[key];
              needsUpdate = true;
            });
          }
        }
        
        if (needsUpdate) {
          try {
            await userDoc.ref.update(updatedData);
            console.log(`   ✅ Updated user preferences: ${userData.displayName || userDoc.id}`);
            usersUpdated++;
          } catch (error) {
            console.error(`   ❌ Error updating user ${userDoc.id}:`, error.message);
            totalErrors++;
          }
        }
      }
      
      if (usersUpdated === 0) {
        console.log('   ✅ No user recommendation preferences found to remove.');
      } else {
        console.log(`   📊 Updated ${usersUpdated} user preferences`);
      }
    } catch (error) {
      console.error('   ❌ Error checking user preferences:', error.message);
      totalErrors++;
    }
    
    console.log('');
    
    // 6. Check for any other collections that might contain recommendation data
    console.log('🔍 Checking other collections for recommendation data...');
    try {
      const collections = await db.listCollections();
      const otherCollections = collections.filter(col => 
        !['posts', 'users', 'recommendations'].includes(col.id)
      );
      
      for (const collection of otherCollections) {
        try {
          const snapshot = await collection.get();
          const recommendationDocs = snapshot.docs.filter(doc => {
            const data = doc.data();
            const dataString = JSON.stringify(data).toLowerCase();
            return dataString.includes('recommendation');
          });
          
          if (recommendationDocs.length > 0) {
            console.log(`   📋 Found ${recommendationDocs.length} items with recommendation data in ${collection.id} collection...`);
            
            const deletePromises = recommendationDocs.map(async (doc) => {
              try {
                await doc.ref.delete();
                console.log(`   ✅ Deleted from ${collection.id}: ${doc.id}`);
                return { success: true, type: collection.id, id: doc.id };
              } catch (error) {
                console.error(`   ❌ Error deleting from ${collection.id} ${doc.id}:`, error.message);
                return { success: false, type: collection.id, id: doc.id, error: error.message };
              }
            });
            
            const results = await Promise.all(deletePromises);
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            totalDeleted += successful;
            totalErrors += failed;
            
            console.log(`   📊 ${collection.id}: ${successful} deleted, ${failed} failed`);
          }
        } catch (error) {
          console.error(`   ❌ Error checking ${collection.id} collection:`, error.message);
        }
      }
    } catch (error) {
      console.error('   ❌ Error listing collections:', error.message);
      totalErrors++;
    }
    
    console.log('');
    console.log('📊 Final Summary:');
    console.log('================');
    console.log(`   ✅ Total items deleted: ${totalDeleted}`);
    console.log(`   ❌ Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 All recommendation data deleted successfully!');
    } else {
      console.log('\n⚠️  Some items failed to delete. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

deleteAllRecommendations();



