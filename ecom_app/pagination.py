from rest_framework.pagination import PageNumberPagination

class MypagenumberPagination(PageNumberPagination):
    page_size = 5

