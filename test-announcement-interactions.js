import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testAnnouncementInteractions() {
  console.log('🧪 Testing Announcement Interactions\n');

  try {
    // 1. Login as resident
    console.log('1️⃣ Logging in as resident...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'juan.delacruz@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');

    // 2. Get announcements
    console.log('2️⃣ Fetching announcements...');
    const announcementsResponse = await fetch(`${API_URL}/announcements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const { data: announcements } = await announcementsResponse.json();
    console.log(`✅ Found ${announcements.length} announcements\n`);

    if (announcements.length === 0) {
      console.log('⚠️ No announcements found to test');
      return;
    }

    const testAnnouncementId = announcements[0].id;
    console.log(`📢 Testing with announcement ID: ${testAnnouncementId}\n`);

    // 3. Test getting reactions (before toggle)
    console.log('3️⃣ Getting initial reactions...');
    const reactionsResponse1 = await fetch(`${API_URL}/announcements/${testAnnouncementId}/reactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!reactionsResponse1.ok) {
      console.error('❌ Get reactions failed:', await reactionsResponse1.text());
      return;
    }

    const reactions1 = await reactionsResponse1.json();
    console.log('✅ Initial reactions:', reactions1.data);
    console.log();

    // 4. Test toggle reaction (add)
    console.log('4️⃣ Toggling reaction (add)...');
    const toggleReactionResponse1 = await fetch(`${API_URL}/announcements/${testAnnouncementId}/react`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!toggleReactionResponse1.ok) {
      console.error('❌ Toggle reaction failed:', await toggleReactionResponse1.text());
      return;
    }

    const toggleResult1 = await toggleReactionResponse1.json();
    console.log('✅ Reaction toggled:', toggleResult1);
    console.log();

    // 5. Test getting reactions (after toggle)
    console.log('5️⃣ Getting reactions after toggle...');
    const reactionsResponse2 = await fetch(`${API_URL}/announcements/${testAnnouncementId}/reactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const reactions2 = await reactionsResponse2.json();
    console.log('✅ Reactions after toggle:', reactions2.data);
    console.log();

    // 6. Test add comment
    console.log('6️⃣ Adding a comment...');
    const addCommentResponse = await fetch(`${API_URL}/announcements/${testAnnouncementId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: 'Test comment from API test script' })
    });

    if (!addCommentResponse.ok) {
      console.error('❌ Add comment failed:', await addCommentResponse.text());
      return;
    }

    const commentResult = await addCommentResponse.json();
    console.log('✅ Comment added:', commentResult.data);
    console.log();

    // 7. Test get comments
    console.log('7️⃣ Getting comments...');
    const commentsResponse = await fetch(`${API_URL}/announcements/${testAnnouncementId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!commentsResponse.ok) {
      console.error('❌ Get comments failed:', await commentsResponse.text());
      return;
    }

    const comments = await commentsResponse.json();
    console.log('✅ Comments:', comments.data);
    console.log();

    // 8. Test delete comment
    if (comments.data.comments.length > 0) {
      const commentId = comments.data.comments[0].id;
      console.log(`8️⃣ Deleting comment ${commentId}...`);
      const deleteCommentResponse = await fetch(`${API_URL}/announcements/${testAnnouncementId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!deleteCommentResponse.ok) {
        console.error('❌ Delete comment failed:', await deleteCommentResponse.text());
        return;
      }

      const deleteResult = await deleteCommentResponse.json();
      console.log('✅ Comment deleted:', deleteResult);
      console.log();
    }

    // 9. Test toggle reaction (remove)
    console.log('9️⃣ Toggling reaction (remove)...');
    const toggleReactionResponse2 = await fetch(`${API_URL}/announcements/${testAnnouncementId}/react`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const toggleResult2 = await toggleReactionResponse2.json();
    console.log('✅ Reaction toggled:', toggleResult2);
    console.log();

    console.log('✅ All tests passed! 🎉');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAnnouncementInteractions();
