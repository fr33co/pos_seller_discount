# -*- encoding: utf-8 -*-
from openerp import models, fields


class PosConfig(models.Model):
    _inherit = 'pos.config'

    discount_pc = fields.Float('Porcentaje de descuento', default=10)
    type_product = fields.Many2many('pos.category', required=True,
                                    string='Categorias del producto')
