from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import *
import random
from django.core.mail import send_mail
from django.conf import settings



class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
   
    
    
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()

    
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    

    
class Userserializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        

        
class CategorySerializer(serializers.ModelSerializer):    
    class Meta:
        model = category
        fields = ('id', 'name', 'desc', 'is_active', 'created_at')
        
        
        
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = product
        fields = '__all__'
        
        
        
class Cart_item_Serializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='Product.name', default="No Partner")
    class Meta:
        model = Cart_item
        fields = ['cart', 'quantity', 'Product','product_name']
        
        
        
class Checkoutserializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source='delivery_partner.user.username', read_only=True)
    class Meta:
        model = Checkout
        fields = '__all__'
        read_only_fields = ['total_price', 'Product','user', 'quantity', 'partner_name']
        
        
class PendingpartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model= Pendingpartner
        fields = '__all__'
        
class DeliveryPartnerSerializer(serializers.ModelSerializer):
    checkout_list = Checkoutserializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = DeliveryPartner
        fields = ['user', 'is_available', 'username', 'checkout_list']