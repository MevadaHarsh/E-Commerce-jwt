from django.db import models
from django.contrib.auth.models import  User
from django.core.validators import MinValueValidator

# Create your models here.
class PendingUser(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    username = models.CharField(max_length=100, null=True)
    password = models.CharField(max_length=255, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.username
    
    
    
class category(models.Model):
    name = models.CharField(max_length=100)
    desc = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True, help_text="Designates whether this record should be treated as active.")
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    
    def __str__(self):
        return self.name
    
    
    
class product(models.Model):
    category = models.ForeignKey(category, on_delete= models.CASCADE)
    name = models.CharField(max_length=100)
    price = models.IntegerField(null=True)
    stock = models.IntegerField(null=True, validators=[MinValueValidator(0)])
    is_available = models.BooleanField(default=True, help_text="Product is available or not")
    
    
    def save(self, *args, **kwargs):
        if self.stock <= 0 :
            self.is_available = False
            
        else :
            self.is_available =True
            
        return super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    
    
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.user.username

    
    
class Cart_item(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    Product = models.ForeignKey(product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0,null=True)
    
    def total_price(self):
        return self.Product.price * self.quantity
    
    def __str__(self):
        return f"{self.cart.user.username}"
    
    

    
    
    
class Pendingpartner(models.Model):
    username = models.CharField(max_length=100, null=True)
    password = models.CharField(max_length=255, null=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    def __str__(self):
        return self.username
    
    
class DeliveryPartner(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # orders = models.ForeignKey(Checkout, on_delete=models.CASCADE)
    is_available = models.BooleanField(default=True, help_text="Delivery Partner is available or not")
    # Product = models.ManyToManyField(product)
    # quantity=models.IntegerField(default=0, null=True, blank=True)
    # total_price=models.IntegerField(null=True, blank=True)
    # created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    
    
    def __str__(self):
        return self.user.username
    
    
class Checkout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    Product = models.ManyToManyField(product)
    # quantity = models.IntegerField(default=0)
    # price = models.FloatField()
    full_name = models.CharField(max_length=100)
    phone=models.IntegerField()
    address=models.TextField()
    city=models.CharField(max_length=50)
    pincode=models.CharField(max_length=50)
    total_price=models.IntegerField(null=True, blank=True)
    quantity=models.IntegerField(default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE, null=True, related_name='checkout_list')
    status=models.CharField(max_length=50, default="Pending")
    cancel_reason = models.CharField(max_length=100, default="N/A")

    def __str__(self):
        return f"{self.user.username}"