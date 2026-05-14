from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(PendingUser)

admin.site.register(category)

admin.site.register(product)

admin.site.register(Cart)

admin.site.register(Cart_item)

admin.site.register(Checkout)

admin.site.register(Pendingpartner)

admin.site.register(DeliveryPartner)