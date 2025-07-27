
const discussionModalRoot = document.getElementById('discussionModalRoot');
let currentDiscussions = [];
let currentDid = null;
let currentTid = null;


function showDialog(modalElem) {
  discussionModalRoot.innerHTML = '';
  discussionModalRoot.appendChild(modalElem);
}

// Load and display discussions for a tournament
async function loadDiscussions(tid) {
  try {
    const res = await fetch(`${API_BASE}/discussions/${tid}`);
    const list = await res.json();
    currentDiscussions = list;
    showDialog(createDiscussionsModal(list, tid));

  } catch (err) {
    console.log(err)
    console.error(`Failed to load discussions: ${err.message}`);
  }
}



// Create a new discussion
async function createDiscussion(tid, title, content) {
  try {
    const response = await fetch(`${API_BASE}/discussions/${tid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: content }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error creating discussion: ${errorData.error}`);
    }

    discussionModalRoot.innerHTML = '';


    loadDiscussions(tid);

  } catch (err) {
    console.error(`Join failed: ${err.message}`);
  }
}

function updateDiscussions(list) {
  const discussionList = discussionModalRoot.querySelector('.discussions-list');
  if (!discussionList) {
    console.warn('No .discussions-list element found');
    return;
  }

  discussionList.innerHTML = '';

  if (list.length === 0) {
    discussionList.insertAdjacentHTML('beforeend', '<p>No discussions yet.</p>');
    return;
  }

  list.forEach(d => {
    const html = `
      <div class="discussion-item">
        <h4>${d.title}</h4>
        <p>${d.description}</p>
        <small>
          by ${d.creator_username} on
          ${new Date(d.created_at).toLocaleDateString()}
        </small>
        <div class="discussion-actions" style="display: flex; gap: .5rem;">
          <button
            class="btn-primary reply-discussion-btn"
            data-did="${d.id}">
            View Replies
          </button>
        </div>
      </div>
    `;
    discussionList.insertAdjacentHTML('beforeend', html);
  });
}

//updtate discussion
async function UpdateDiscussion(did, title, content, tid) {
  try {
    await fetch(`${API_BASE}/discussions/${did}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    loadDiscussions(tid);
  } catch (err) {
    console.error(`Update failed: ${err.message}`);

  }
}

// Delete a discussion
async function deleteDiscussion(did, tid) {
  if (!confirm('Remove this discussion?')) return;
  try {
    await fetch(`${API_BASE}/discussions/${did}`, {
      method: 'DELETE'
    });
    loadDiscussions(tid);
  } catch (err) {
    console.error(`Delete failed: ${err.message}`);
  }

}



// Load and display replies for a discussion
async function loadReplies(did, tid, discussion) {
  try {
    const res = await fetch(`${API_BASE}/discussions/${did}/replies`);
    const replies = await res.json();
    showDialog(createReplyFormModal(did, tid, discussion, replies));
    updateReplies(replies);
  } catch (err) {
    console.error(`Failed to load replies: ${err.message}`);
  }
}

// Post a new reply
async function createReply(did, content, tid) {
  try {
    await fetch(`${API_BASE}/discussions/${did}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });

    discussionModalRoot.innerHTML = '';
    viewDiscussionDetails(did, tid);

  } catch (err) {
    console.error(`Post reply failed: ${err.message}`);
  }
}

//update reply
function updateReplies(replies) {
  const repliesList = document.getElementById('replies-list');
  if (!repliesList) return console.warn('No #replies-list element found');
  const userId = localStorage.getItem('currentUser');

  repliesList.innerHTML = '';


  if (replies.length === 0) {
    repliesList.insertAdjacentHTML(
      'beforeend',
      '<p class="no-replies">No replies yet. Be the first to reply!</p>'
    );
    return;
  }

  replies.forEach(reply => {
    const item = `
      <div class="reply-item">
        <div class="reply-content">${reply.content}</div>
        <div class="reply-meta">
          <span class="author">By: ${reply.author_name || 'Anonymous'}</span>
          <span class="date">On: ${new Date(reply.created_at).toLocaleDateString()}</span>
        </div>
        <div class="reply-actions">
          ${reply.user_id == userId
        ? `
          
          <button class="btn-edit edit-reply-btn" data-rid="${reply.id}">Edit</button>
          <button class="btn-delete delete-reply-btn" data-rid="${reply.id}">Remove</button>
            `
        : ''
      }

      </div>
    `;

    repliesList.insertAdjacentHTML('beforeend', item);
  });
}


// View discussion details with replies
async function viewDiscussionDetails(did, tid) {
  try {
    currentDid = did;
    currentTid = tid;
    const listRes = await fetch(`${API_BASE}/discussions/${tid}`);
    currentDiscussions = await listRes.json();

    const discussion = currentDiscussions.find(d => d.id.toString() === did.toString());
    if (!discussion) throw new Error('Discussion not found.');

    const repliesRes = await fetch(`${API_BASE}/discussions/${did}/replies`);
    discussion.replies = await repliesRes.json();

    currentReplies = discussion.replies;

    showDialog(createDiscussionDetailsModal(discussion, tid));

    updateReplies(discussion.replies);

  } catch (err) {
    console.error(`Failed to load discussion details: ${err.message}`);
    alert(`Error: ${err.message}`);
  }
}
//upate reply
async function updateReply(rid, content) {
  try {
    await fetch(`${API_BASE}/discussions/replies/${rid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    viewDiscussionDetails(currentDid, currentTid);

  } catch (err) {
    console.error(`Update reply failed: ${err.message}`);
  }
}

//delete reply
async function deleteReply(rid) {
  if (!confirm('Remove this reply?')) return;
  try {
    await fetch(`${API_BASE}/discussions/${currentDid}/replies/${rid}`, { method: 'DELETE' });
    viewDiscussionDetails(currentDid, currentTid);

  } catch (err) {
    console.error(`Delete reply failed: ${err.message}`);
  }
}



// Create the main discussions modal
function createDiscussionsModal(list, tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  const userId = localStorage.getItem('currentUser');

  
  const items = list.map(d => `
    <div class="discussion-item">
      <h4>${d.title}</h4>
      <p>${d.description}</p>
      <small>by ${d.creator_username} on ${new Date(d.created_at).toLocaleDateString()}</small>
      <div class="discussion-actions" style="display: flex; justify-content: center; gap: .5rem;">
        <button class="btn-primary reply-discussion-btn" data-did="${d.id}">
          View Replies
        </button>
          ${
          d.creator_id == userId
                ? `
         <button
              class="btn-edit edit-discussion-btn"
              data-did="${d.id}"
              data-tid="${tid}"
            >
              Edit
            </button>

            <button
              class="btn-delete delete-discussion-btn"
              data-did="${d.id}"
              data-tid="${tid}"
            >
              Remove
        </button>
                `
              : ''
          }
  
      </div>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Discussions - Tournament ${tid}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-actions">
        <button class="btn-primary create-discussion-btn" data-tid="${tid}">Start New Discussion</button>
      </div>
      <div class="discussions-list">
        ${list.length > 0 ? items : '<p>No discussions yet.</p>'}
      </div>
    </div>
  `;
  return modal;
}

// Create-discussion form modal
function createDiscussionFormModal(tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Start New Discussion</h2>
        <button class="close-modal">&times;</button>
      </div>
      <form id="create-discussion-form">
        <input type="hidden" name="tid" value="${tid}">
        <div class="form-group">
          <label for="discussion-title">Title</label>
          <input type="text" id="discussion-title" name="title" required placeholder="Enter discussion title...">
        </div>
        <div class="form-group">
          <label for="discussion-content">Content</label>
          <textarea id="discussion-content" name="content" class="form-control" rows="5" required placeholder="Share your thoughts..."></textarea>
        </div>
        <div class="form-actions" style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button type="button" class="btn-secondary close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Start Discussion</button>
        </div>
      </form>
    </div>
  `;
  return modal;
}

//Reply form modal
function createReplyFormModal(did, tid, discussion) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Reply to: ${discussion}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="reply-discussion-form" class="discussion-form">
                    <input type="hidden" name="did" value="${did}">
                    <input type="hidden" name="tid" value="${tid}">  

                    <div class="form-group">
                        <label for="reply-content">Your Reply:</label>
                      <textarea id="reply-content" name="content" rows="5" placeholder="Write your reply here..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Post Reply</button>
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                    </div>
                </form>
            </div>
        `;
  return modal;
}

function createDiscussionDetailsModal(discussion, tid) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <button class="back-to-discussions-btn" data-tid="${tid}">← Back</button>
        <h2>${discussion.title}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="discussion-full-content">
        <div class="discussion-content-full">${discussion.description}</div>
        <div class="discussion-meta-full">
          <span class="author">Started by: ${discussion.creator_username}</span>
          <span class="created-date">Created: ${new Date(discussion.created_at).toLocaleDateString()}</span>
        </div>
        <div class="replies-section">
          <h3>Replies (<span id="replies-count">${discussion.replies.length}</span>)</h3>
          <div id="replies-list" class="replies-list"></div>
        </div>
        <div class="modal-actions" style="margin-top:1rem; text-align:center;">
          <button 
            class="btn-primary add-reply-btn" 
            data-did="${discussion.id}" 
            data-tid="${tid}"
            data-discussion="${discussion.title}">
            Add Reply
          </button>
        </div>
      </div>
    </div>
  `;
  return modal;
}

function createEditDiscussionModal(discussion, tid) {
  return Object.assign(document.createElement('div'), {
    className: 'modal-overlay',
    innerHTML: `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Discussion</h2>
          <button class="close-modal">&times;</button>
        </div>
        <form id="edit-discussion-form">
          <input type="hidden" name="did" value="${discussion.id}">
          <input type="hidden" name="tid" value="${tid}">
          <div class="form-group">
            <label>Title</label>
            <input name="title" value="${discussion.title}" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" required>${discussion.description}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary cancel-edit-discussion-btn " data-tid="${tid}" >Cancel</button>
            <button type="submit" class="btn-primary">Update</button>
          </div>
        </form>
      </div>
    `
  });
}

function createEditReplyModal(reply) {
  return Object.assign(document.createElement('div'), {
    className: 'modal-overlay',
    innerHTML: `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Reply</h2>
          <button class="close-modal">&times;</button>
        </div>
        <form id="edit-reply-form">
          <input type="hidden" name="rid" value="${reply.id}">
          <div class="form-group">
            <label for="reply-content-edit">Content</label>
            <textarea id="reply-content-edit" name="content" rows="5" required>${reply.content}</textarea>
          </div>
          <div class="form-actions" style="display:flex; justify-content:flex-end; gap:.5rem;">
            <button type="button" class="btn-secondary cancel-edit-reply-btn">Cancel</button>
            <button type="submit" class="btn-primary">Update Reply</button>
          </div>
        </form>
      </div>
    `
  });
}


document.addEventListener('click', e => {
  // close any modal
  if (e.target.matches('.close-modal')) {
    discussionModalRoot.innerHTML = '';
    return;
  }

  // open discussions modal
  else if (e.target.matches('.view-discussions-btn')) {
    const tid = e.target.closest('.tournament-card').dataset.tournamentId;
    loadDiscussions(tid);
    return;
  }

  else if (e.target.classList.contains('view-discussion-btn')) {
    const discussionId = e.target.dataset.discussionId;
    viewDiscussionDetails(discussionId);
    return;
  }

  // open create form
  else if (e.target.matches('.create-discussion-btn')) {
    const tid = e.target.dataset.tid;
    const dialog = createDiscussionFormModal(tid)
    showDialog(dialog);
  }

  // open create reply form
  else if (e.target.matches('.add-reply-btn')) {
    const did = e.target.dataset.did;
    const discussion = e.target.dataset.discussion;
    const tid = e.target.closest('.modal-content').querySelector('[data-tid]').dataset.tid;
    showDialog(createReplyFormModal(did, tid, discussion))
    return;
  }


  // open reply list
  else if (e.target.matches('.reply-discussion-btn')) {
    const did = e.target.dataset.did;
    const tid = e.target.closest('.modal-content').querySelector('[data-tid]').dataset.tid;
    viewDiscussionDetails(did, tid);
    return;
  }


  //edit discussion
  else if (e.target.matches('.edit-discussion-btn')) {
    const did = e.target.dataset.did;
    const tid = e.target.dataset.tid;
    const discussion = currentDiscussions.find(d => d.id.toString() === did);
    showDialog(createEditDiscussionModal(discussion, tid));
    return;
  }

  // delete a discussion
  else if (e.target.matches('.delete-discussion-btn')) {
    const did = e.target.dataset.did;
    const tid = e.target.dataset.tid;
    deleteDiscussion(did, tid);
    return;
  }

  // Back button
  else if (e.target.matches('.back-to-discussions-btn')) {
    const tid = e.target.dataset.tid;
    loadDiscussions(tid);
    return;
  }

  if (e.target.matches('.edit-reply-btn')) {
    const rid = e.target.dataset.rid;
    const reply = currentReplies.find(r => r.id.toString() === rid);
    showDialog(createEditReplyModal(reply));
    return;
  }

  // Remove reply button
  if (e.target.matches('.delete-reply-btn')) {
    deleteReply(e.target.dataset.rid);
    return;
  }

  // Cancel inside edit-reply modal
  if (e.target.matches('.cancel-edit-reply-btn')) {
    viewDiscussionDetails(currentDid, currentTid);
    return;
  }

  else if (e.target.matches('.cancel-edit-discussion-btn')) {
    const tid = e.target.dataset.tid;
    loadDiscussions(tid);
    return;
  }

});

document.addEventListener('submit', e => {
  if (e.target.id === 'create-discussion-form') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tid = fd.get('tid');
    const title = fd.get('title');
    const content = fd.get('content');
    createDiscussion(tid, title, content);
  }


  else if (e.target.matches('#reply-discussion-form')) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const did = fd.get('did');
    const tid = fd.get('tid');
    const content = fd.get('content');
    createReply(did, content, tid);
  }

  if (e.target.matches('#edit-discussion-form')) {
    e.preventDefault();
    const fd = new FormData(e.target);
    UpdateDiscussion(
      fd.get('did'),
      fd.get('title'),
      fd.get('description'),
      fd.get('tid')
    );
  }

  if (e.target.id === 'edit-reply-form') {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateReply(
      fd.get('rid'),
      fd.get('content'));
  }

});

