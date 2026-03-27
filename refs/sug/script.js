// 全局变量
let currentUser = null;
let currentUserType = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    
    // 绑定事件
    bindEvents();
});

// 检查登录状态
function checkLoginStatus() {
    const user = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('currentUserType');
    
    if (user && userType) {
        currentUser = user;
        currentUserType = userType;
        updateUIForLoggedInUser();
    }
}

// 更新登录后的UI
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const publishBtn = document.getElementById('publish-btn');
    const commentBtn = document.querySelector('.comment-btn');
    const replyBtn = document.querySelector('.reply-btn');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) {
        userInfo.style.display = 'inline';
        userInfo.textContent = `${currentUser} (${currentUserType === 'villager' ? '村民' : '村干部'})`;
    }
    if (logoutBtn) logoutBtn.style.display = 'inline';
    if (publishBtn) publishBtn.style.display = 'inline';
    if (commentBtn) commentBtn.style.display = 'block';
    if (replyBtn && currentUserType === 'official') replyBtn.style.display = 'block';
}

// 绑定事件
function bindEvents() {
    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // 退出登录
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // 发布意见按钮
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
        publishBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                window.location.href = 'publish.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
    
    // 提交发布
    const publishForm = document.getElementById('publish-form');
    if (publishForm) {
        publishForm.addEventListener('submit', function(e) {
            e.preventDefault();
            publishOpinion();
        });
    }
    
    // 点赞功能
    const likeBtns = document.querySelectorAll('.like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentUser) {
                likeOpinion(this);
            } else {
                window.location.href = 'login.html';
            }
        });
    });
    
    // 发表评论按钮
    const commentBtn = document.querySelector('.comment-btn');
    if (commentBtn) {
        commentBtn.addEventListener('click', function() {
            if (currentUser) {
                document.querySelector('.comment-form').style.display = 'block';
                this.style.display = 'none';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
    
    // 取消评论
    const cancelComment = document.getElementById('cancel-comment');
    if (cancelComment) {
        cancelComment.addEventListener('click', function() {
            document.querySelector('.comment-form').style.display = 'none';
            document.querySelector('.comment-btn').style.display = 'block';
        });
    }
    
    // 提交评论
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment();
        });
    }
    
    // 发表回复按钮
    const replyBtn = document.querySelector('.reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', function() {
            if (currentUser && currentUserType === 'official') {
                document.querySelector('.reply-form').style.display = 'block';
                this.style.display = 'none';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
    
    // 取消回复
    const cancelReply = document.getElementById('cancel-reply');
    if (cancelReply) {
        cancelReply.addEventListener('click', function() {
            document.querySelector('.reply-form').style.display = 'none';
            document.querySelector('.reply-btn').style.display = 'block';
        });
    }
    
    // 提交回复
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitReply();
        });
    }
    
    // 干部回复按钮
    const replyBtn = document.querySelector('.reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', function() {
            if (currentUser && currentUserType === 'official') {
                window.location.href = 'reply.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
    
    // 注册表单提交
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // 审核通过按钮
    const approveBtns = document.querySelectorAll('.approve-btn');
    approveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const registrationItem = this.closest('.registration-item');
            const statusElement = registrationItem.querySelector('.status');
            statusElement.textContent = '已通过';
            statusElement.className = 'status approved';
            this.parentElement.innerHTML = '<span class="status approved">已通过</span>';
            alert('审核通过');
        });
    });
    
    // 审核拒绝按钮
    const rejectBtns = document.querySelectorAll('.reject-btn');
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const registrationItem = this.closest('.registration-item');
            const statusElement = registrationItem.querySelector('.status');
            statusElement.textContent = '已拒绝';
            statusElement.className = 'status rejected';
            this.parentElement.innerHTML = '<span class="status rejected">已拒绝</span>';
            alert('审核拒绝');
        });
    })
}

// 登录函数
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('user-type').value;
    
    // 简单的模拟登录验证
    if (username && password) {
        localStorage.setItem('currentUser', username);
        localStorage.setItem('currentUserType', userType);
        currentUser = username;
        currentUserType = userType;
        
        // 村干部登录后跳转到审核页面
        if (userType === 'official') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    } else {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = '请输入用户名和密码';
            errorElement.style.display = 'block';
        }
    }
}

// 注册函数
function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    
    // 验证密码
    if (password !== confirmPassword) {
        const errorElement = document.getElementById('register-error');
        if (errorElement) {
            errorElement.textContent = '两次输入的密码不一致';
            errorElement.style.display = 'block';
        }
        return;
    }
    
    // 简单的模拟注册
    if (username && password && name && phone && address) {
        // 这里可以添加实际的注册逻辑
        const successElement = document.getElementById('register-success');
        if (successElement) {
            successElement.textContent = '注册成功，等待村干部审核';
            successElement.style.display = 'block';
        }
        
        // 清空表单
        document.getElementById('register-form').reset();
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } else {
        const errorElement = document.getElementById('register-error');
        if (errorElement) {
            errorElement.textContent = '请填写所有必填字段';
            errorElement.style.display = 'block';
        }
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserType');
    currentUser = null;
    currentUserType = null;
    window.location.href = 'index.html';
}

// 发布意见
function publishOpinion() {
    const title = document.getElementById('opinion-title').value;
    const category = document.getElementById('opinion-category').value;
    const content = document.getElementById('opinion-content').value;
    
    if (title && content) {
        // 这里可以添加实际的发布逻辑
        alert('意见发布成功！');
        // 清空表单
        document.getElementById('publish-form').reset();
        // 跳转到首页
        window.location.href = 'index.html';
    }
}

// 提交回复
function submitReply() {
    const content = document.getElementById('reply-content').value;
    
    if (content) {
        // 这里可以添加实际的回复逻辑
        alert('回复发表成功！');
        // 清空表单
        document.getElementById('reply-form').reset();
        // 跳转到意见详情页
        window.location.href = 'detail.html?id=1';
    }
}

// 点赞功能
function likeOpinion(btn) {
    const likeCount = btn.querySelector('.like-count');
    const currentCount = parseInt(likeCount.textContent);
    likeCount.textContent = currentCount + 1;
    // 这里可以添加实际的点赞逻辑
}

// 提交评论
function submitComment() {
    const content = document.getElementById('comment-content').value;
    
    if (content) {
        // 这里可以添加实际的评论逻辑
        alert('评论发表成功！');
        // 清空表单
        document.getElementById('comment-form').reset();
        // 隐藏评论表单
        document.querySelector('.comment-form').style.display = 'none';
        document.querySelector('.comment-btn').style.display = 'block';
        // 刷新页面
        window.location.reload();
    }
}

// 提交回复
function submitReply() {
    const content = document.getElementById('reply-content').value;
    
    if (content) {
        // 这里可以添加实际的回复逻辑
        alert('回复发表成功！');
        // 清空表单
        document.getElementById('reply-form').reset();
        // 隐藏回复表单
        document.querySelector('.reply-form').style.display = 'none';
        document.querySelector('.reply-btn').style.display = 'block';
        // 刷新页面
        window.location.reload();
    }
}