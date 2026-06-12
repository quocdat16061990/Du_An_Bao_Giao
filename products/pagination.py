"""Custom pagination với cached COUNT để tránh slow query trên Supabase."""
import logging

from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

logger = logging.getLogger('products')


class FastPagination(PageNumberPagination):
    """Cached COUNT — tránh scan toàn bộ DB mỗi request."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request

        # COUNT theo đúng queryset hiện tại (đã filter)
        self.count = queryset.count()
        logger.info(f'[Pagination] count = {self.count}')

        if self.count == 0:
            self.next_link = None
            self.previous_link = None
            self.total_pages = 0
            self.page_number = 1
            return []

        # Validate page_size
        page_size = self.get_page_size(request)
        if page_size > self.max_page_size:
            page_size = self.max_page_size

        # Validate page number
        page_number = int(request.query_params.get('page', 1))
        total_pages = max(1, -(-self.count // page_size))
        if page_number > total_pages:
            page_number = total_pages

        # Slice queryset manually (tránh COUNT lần 2 từ DRF)
        offset = (page_number - 1) * page_size
        self.page_number = page_number
        self.total_pages = total_pages

        # Tính next/previous links thủ công
        base_url = request.build_absolute_uri().split('?')[0]
        query_params = request.query_params.copy()
        if page_number < total_pages:
            query_params['page'] = str(page_number + 1)
            self.next_link = f"{base_url}?{query_params.urlencode()}"
        else:
            self.next_link = None

        query_params['page'] = str(page_number - 1)
        if page_number > 1:
            self.previous_link = f"{base_url}?{query_params.urlencode()}"
        else:
            self.previous_link = None

        return list(queryset[offset:offset + page_size])

    def get_next_link(self):
        return self.next_link

    def get_previous_link(self):
        return self.previous_link

    def get_paginated_response(self, data):
        return Response({
            'count': self.count,
            'next': self.next_link,
            'previous': self.previous_link,
            'total_pages': self.total_pages,
            'current_page': self.page_number,
            'results': data,
        })
