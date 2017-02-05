# -*- coding: utf-8 -*-

{
    'name': 'POS Seller',
    'description': """
        Agrega vendedor en pos.order.line y permite hacer descuentos segun el
        vendedor (Si no es interno).
    """,
    'author': "Angel A. Guadarrama B.",
    'website': "http://www.4ojos.com.ve",
    'category': 'Point of Sale',
    'version': '0.1',
    "depends": ['base', 'point_of_sale'],
    "data": [
        'views/res_users.xml',
        'views/point_of_sale.xml',
        'views/pos_seller.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'demo': [],
}
