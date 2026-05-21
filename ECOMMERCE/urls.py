"""
URL configuration for ECOMMERCE project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView)
from ecom_app.views import *
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from django.conf.urls.static import static



router = DefaultRouter()
router.register('category', CategoryViewset, basename='category')
router.register('product', ProductViewset, basename='product')
router.register('Pendingpartner', PendingpartnerView)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    
    
    path('api/register/', RegisterAPIView.as_view(), name='register-api'),
    path('api/verify/', VerifyOTPAPIView.as_view(), name='verify'),
    path('api/verify-delivery/', VerifyOTPDeliveryAPIView.as_view(), name='verify-delivery'),
    path('api/login/', loginview.as_view(), name='login-api'),
    path('api/user/', UserView.as_view(), name='user-api'),
    path('api/', include(router.urls)),
    
    
    
    # path('register/', TemplateView.as_view(template_name="index.html"), name='register'),
    path('register/',register.as_view(), name='register'),
    path('login/', TemplateView.as_view(template_name="login.html"), name='login'),
    path('product-admin/', TemplateView.as_view(template_name="product-admin.html"), name='product-admin'),
    path('', TemplateView.as_view(template_name="dashboard.html"), name='dashboard'),
    path('category-admin/', TemplateView.as_view(template_name="category-admin.html"), name='category-admin'),
    path('category-user/', TemplateView.as_view(template_name="category-user.html"), name='category-user'),
    path('cart/', TemplateView.as_view(template_name="cart.html"), name='cart'),
    path('order-list/', TemplateView.as_view(template_name="order-admin.html"), name='order-page'),
    path('checkout/', TemplateView.as_view(template_name="checkout.html"), name='checkout'),
    path('registration-delivery/', TemplateView.as_view(template_name="registration-delivery.html"), name='registation-delivery'),
    path('dashboard-delivery/', TemplateView.as_view(template_name="dashboard-delivery.html"), name='dashboard-delivery'),
    path('partner_list/', TemplateView.as_view(template_name="partner_list-admin.html"), name='partner_list'),
    
    
    
    path('api/add_to_cart/<int:product_id>/', AddToCartView.as_view(), name='add_to_cart'),
    path('api/cart/', CartView.as_view(), name='cart-api'),
    path('api/DeliveryPartner/', DeliveryPartnerView.as_view(), name='DeliveryPartner'),
    
    
    
    path('api/increase/<int:product_id>/', IncreaseView.as_view(), name='increase'),
    path('api/decrease/<int:product_id>/', DecreaseView.as_view(), name='decrease'),
    path('api/checkout/', CheckoutView.as_view(), name='api-checkout'),
    path('api/checkout-view/', CheckoutList.as_view(), name='api-checkout-view'),
    
    path('api/Order-status/<int:pk>/', DeliveryStatusUpdateView.as_view(), name='Orderstatusupdate'),
    path('api/delivery-partners/', DeliveryPartnerLISTView.as_view(), name='delivery-partners'),
    
    
    path("api/razorpay/create-order/",CreateOrder.as_view()),
    path("payment-verify/",PaymentCallbackView.as_view(), name="payment-verify"),
    # path('api/Pendingpartner/', PendingpartnerView.as_view(), name='PendingpartnerView'),

    
    # path('api/order-list/', Orderlist.as_view(), name='order-list'),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)