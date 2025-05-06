let currentPageIndex = 1;
let pageSizeIndex = 5;

window.addEventListener('DOMContentLoaded', function () {
    updateStoreId();
    document.querySelector("form").addEventListener("submit", function (event) {
        event.preventDefault();  
        currentPageIndex = 1;  
        updateStoreId();  
    });
});

function updateStoreId() {
    const selectedStoreId = document.getElementById('selected-store-id').value;

    if (!selectedStoreId) {
        console.warn('Chưa chọn cửa hàng');
        displayNoStoreIdMessage(); 
        return;
    }

    searchProducts(currentPageIndex, pageSizeIndex);  
}

function displayNoStoreIdMessage() {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';  

    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="6" class="text-center">VUI LÒNG CHỌN CỬA HÀNG ĐỂ XEM TỒN KHO</td>`; 
    tableBody.appendChild(noDataRow);  
}

async function searchProducts(pageNumber = 1, pageSize = 5) {
    const selectedStoreId = document.getElementById('selected-store-id').value;

    const url = `${API_BASE_URL}Stock/Product?PageNumber=${pageNumber}&PageSize=${pageSize}&storeId=${selectedStoreId}`;

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
            throw new Error('Không thể lấy dữ liệu sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

function updateTable(products, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(products) && products.length > 0) {
        products.forEach(product => {
            const stockQuantity =
                product.storeProducts && product.storeProducts.length > 0
                    ? product.storeProducts[0].stockQuantity
                    : 0;

            const row = document.createElement('tr');

            row.innerHTML = `
                <td><strong>${product.name}</strong></td>
                <td><img src="${product.imageUrl}" style="width: 50px; height: auto;" /></td>
                <td>${product.price} VNĐ</td>
                <td><strong>${stockQuantity}</strong></td>
            `;

            tableBody.appendChild(row);
        });

        updatePaginationProduct(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
    }
}

function updatePaginationProduct(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#icream-pagination .pagination');

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
            searchProducts(currentPage, pageSizeIndex);
        }
    });

    prevPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchProducts(currentPage, pageSizeIndex);
        }
    });

    nextPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchProducts(currentPage, pageSizeIndex);
        }
    });

    lastPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            searchProducts(currentPage, pageSizeIndex);
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
            searchProducts(currentPage, pageSizeIndex);
        });

        pageItem.appendChild(pageLink);
        paginationContainer.insertBefore(pageItem, nextPageButton);
    }
}
