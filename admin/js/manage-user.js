window.addEventListener('DOMContentLoaded', async function () {
    searchUsers();
});

let currentPageIndex = 1;
let pageSizeIndex = 10;

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPageIndex = 1;
    searchUsers(currentPageIndex, pageSizeIndex);
});

async function searchUsers(pageNumber = 1, pageSize = 10) {
    const byName = document.querySelector("input[name='byName']").value;
    const byEmail = document.querySelector("input[name='byEmail']").value;
    const byPhone = document.querySelector("input[name='byPhone']").value;
    const byDate = document.querySelector("input[name='byDate']").value;
    const selectedStoreId = document.querySelector("#selected-store-id").value;
    const status = document.querySelector("#dropdownStatusBtn").getAttribute("data-selected-value");

    let formattedDate = '';
    if (byDate) {
        const date = new Date(byDate);
        formattedDate = date.toISOString();
    }

    const url = `${API_BASE_URL}Auth/AllUsers?PageNumber=${pageNumber}&PageSize=${pageSize}&Name=${encodeURIComponent(byName)}&Email=${encodeURIComponent(byEmail)}&PhoneNumber=${encodeURIComponent(byPhone)}&StoreId=${encodeURIComponent(selectedStoreId)}&IsActive=${encodeURIComponent(status)}&Date=${encodeURIComponent(formattedDate)}`;

    try {
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.items)) {
                updateTable(data.items, pageNumber, data.totalPages || 1);
            } else {
                throw new Error('Dữ liệu trả về không đúng cấu trúc');
            }
        } else {
            throw new Error('Không thể lấy dữ liệu người dùng');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

function updateTable(users, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(users) && users.length > 0) {
        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.storeName || 'Chưa có cửa hàng'}</td>
                <td>${user.role}</td>
                <td>${user.isActive ? 'Đã duyệt' : 'Chưa duyệt'}</td>
                <td>
                    <a href="#" class="btn btn-icon text user-update-btn" data-user-id="${user.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="#" class="btn btn-icon text-danger" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </td>
            `;

            tableBody.appendChild(row);
        });

        const updateButtons = document.querySelectorAll(".user-update-btn");
        updateButtons.forEach(button => {
            button.addEventListener("click", async function (e) {
                e.preventDefault();
                const userId = this.getAttribute('data-user-id');
                await updateUserDetail(userId);
            });
        });

        updatePaginationUser(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
    }
}

function updatePaginationUser(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#user-pagination .pagination');

    const firstPageButton = paginationContainer.querySelector('.first');
    const prevPageButton = paginationContainer.querySelector('.prev');
    const nextPageButton = paginationContainer.querySelector('.next');
    const lastPageButton = paginationContainer.querySelector('.last');

    firstPageButton.classList.toggle('disabled', currentPage === 1);
    prevPageButton.classList.toggle('disabled', currentPage === 1);
    nextPageButton.classList.toggle('disabled', currentPage === totalPages);
    lastPageButton.classList.toggle('disabled', currentPage === totalPages);

    const pageItems = paginationContainer.querySelectorAll('.page-item.page-number');
    pageItems.forEach(item => item.remove());

    firstPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            searchUsers(currentPage, pageSizeIndex);
        }
    });

    prevPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchUsers(currentPage, pageSizeIndex);
        }
    });

    nextPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchUsers(currentPage, pageSizeIndex);
        }
    });

    lastPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            searchUsers(currentPage, pageSizeIndex);
        }
    });

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item page-number${i === currentPage ? ' active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = 'javascript:void(0);';
        pageLink.innerText = i;
        pageLink.addEventListener('click', () => {
            currentPage = i;
            searchUsers(currentPage, pageSizeIndex);
        });

        pageItem.appendChild(pageLink);
        paginationContainer.insertBefore(pageItem, nextPageButton);
    }
}

async function updateUserDetail(userId) {
    localStorage.setItem('userId', userId);
    window.location.href = 'manage-user-update.html';
}




