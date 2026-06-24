from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Trả về thông tin user hiện tại."""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'display_name': user.get_full_name() or user.username,
    })


urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/v1/auth/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('api/v1/auth/me/', me_view, name='auth-me'),

    # Products API
    path('api/v1/', include('products.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
